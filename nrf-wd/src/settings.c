#include <string.h>
#include <cJSON.h>
#include <stdio.h>
#include <ctype.h>
#include "settings.h"

static int connection_interval = 20;
static bool system_armed = false;
static s64_t last_alert = 0;
static int alert_interval = 0;
static bool alert_is_pending = false;
static char server_address[] = "watchdog.rantakangas.com:443";
s64_t sensor_data_last_sent = 0;
static bool gps_searching = false;

static double latitude;
static double longitude;



char* get_server_address(void) {
    return server_address;
}

bool alert_pending(void)
{
    return alert_is_pending;
}

void set_alert_pending(bool new_status)
{
    alert_is_pending = new_status;
}

s64_t get_alert_interval(void) {
    return alert_interval;
}

void set_alert_interval(s64_t new_alert_interval) {
    alert_interval = new_alert_interval;
}

bool alert_interval_valid(void) {
    if ( (k_uptime_get() - last_alert) > get_alert_interval() * 1000)
    {
        last_alert = k_uptime_get();
        return true;
    }

    return false;
}

bool get_system_armed(void) {
    return system_armed;
}

void toggle_system_armed(void)
{
    system_armed = !system_armed;
}

void set_system_armed(bool new_status) {
   
    // If new status will be armed and status is different
    // that it was before (disarmed -> armed, not armed -> armed) then calibrate etc.
    if (new_status && (get_system_armed() == false))
    {
        slowFlashLed(0);
        k_msleep(500);          // Wait some time before calibration process
        calibrate_movement();
    }

    // If system's new status will be disarmed 
    // and status is new (armeded -> disarmed)

    if (!new_status && (get_system_armed() == true))
    {
        slowFlashLed(1);
        slowFlashLed(1);
        slowFlashLed(1);
    }
    
    system_armed = new_status;

}

int get_connection_interval(void) {
    return connection_interval;
}

void set_connection_interval(int new_ci) {
    connection_interval = new_ci;
}

int get_sensor_data_last_sent(void) {
    return sensor_data_last_sent;
}

void set_sensor_data_last_sent(int sdls) {
    sensor_data_last_sent = sdls;
}

void set_gps_searching(bool new_gps_searching) {
    gps_searching = new_gps_searching;
}

bool get_gps_searching(void) {
    return gps_searching;
}


void set_location(double lat, double lon) {
    latitude = lat;
    longitude = lon;
}

double get_latitude(void) {
    return latitude;
}

double get_longitude(void) {
    return longitude;
}

bool parse_response(char *pload) {
    
    cJSON *json = cJSON_Parse(pload);

    const cJSON *res_status = NULL;
    const cJSON *armed_status = NULL;
    const cJSON *ci_value = NULL;

    res_status = cJSON_GetObjectItemCaseSensitive(json, "status");
    armed_status = cJSON_GetObjectItemCaseSensitive(json, "armed");
    ci_value = cJSON_GetObjectItemCaseSensitive(json, "ci");

    // Check if server returned Succcess as status
    if (res_status != NULL || sizeof(res_status) != 0) {
        if (strcmp(res_status->valuestring, "Success") == 0) {
            // Checking armed status
            if (armed_status != NULL || sizeof(armed_status) != 0) {
                // Checking if status of armed is true or false
                if (cJSON_IsTrue(armed_status)) {
                    set_system_armed(true);
                } else {        
                    set_system_armed(false);
                }
            } else {
                set_system_armed(get_system_armed());
            }

            // Checking connection interval value
            if (ci_value != NULL || sizeof(ci_value) != 0) {
                int new_ci = ci_value->valueint;
                // Check if value is in supported range
                new_ci = new_ci <= 10 ? 10 : new_ci;
                new_ci = new_ci >= 86400 ? 86400 : new_ci;
                set_connection_interval(new_ci);
            } else {
                set_connection_interval(get_connection_interval());
            }
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}
