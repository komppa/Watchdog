#include <string.h>
#include <zephyr.h>
#include <stdlib.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include "payloads.h"

// Endpoints
char api_path[9] =               "/api/v1/";
char sensor_endpoint[14] =        "/send/sensor/";
char alert_endpoint[24] =         "/trigger/alert/movement";
char registration_endpoint[23] =  "/request/registration/";

int device_imei_lenght = 15;

void create_payload(char *final_send_buf, char *get_url, int get_url_size) {

    char method[4] = "GET";
    char http_ver[13] = "HTTP/1.1\r\n";
    char space[2] = " ";

    char host[7] = "Host: ";
    // server_address
    char rn[5] = "\r\n";

    char connection[26] = "Connection: close\r\n\r\n";
    char end[3] = "\0";

    // Make paylaod
    strcat(final_send_buf, method);     // get
    strcat(final_send_buf, space);
    strcat(final_send_buf, get_url);    // endpoint
    strcat(final_send_buf, space);
    strcat(final_send_buf, http_ver);   // http/1.1\r\n
    strcat(final_send_buf, host);       // host:
    printk("server add\n");
    strcat(final_send_buf, get_server_address());
    strcat(final_send_buf, rn);         // \r\n
    strcat(final_send_buf, connection); // Conneciton..close...
    strcat(final_send_buf, end);
}

void sensor_payload(char *get_url, int *req_size) {

    // Get sensor data
    int temp_int = get_temperature();
    int hum_int = get_humidity();

    // Get battery charge
    int battery_charge_lenght = 4; // By default 
    char *battery_charge = get_device_battery_charge();

    // Calculate how many numbers int contains
    int temp_n_digits = log10(abs(temp_int)) + 2; // + one number + also one for \0
    int hum_n_digits = log10(abs(hum_int)) + 2;

    // If int was negative, add one place to negative-mark
    if (temp_int < 0) temp_n_digits++; 
    if (hum_int < 0) hum_n_digits++;

    // Arrays for temp & hum
    char temperature[temp_n_digits];
    char humidity[hum_n_digits + 1]; // +1 for slash before value


    // Ints to char arrays
    sprintf(temperature, "%d\0", temp_int); 
    sprintf(humidity, "/%d\0", hum_int); // Note slashes before values!

    // Fake air_uality
    char air_quality[] = "/-1/";

    // Make paylaod from char arrays
    strcat(get_url, api_path);
    strcat(get_url, get_imei());
    strcat(get_url, sensor_endpoint);
    strcat(get_url, temperature);
    strcat(get_url, humidity);
    strcat(get_url, air_quality);
    strcat(get_url, battery_charge);
 
    req_size += sizeof(api_path) - 1;
    req_size += device_imei_lenght;
    req_size += sizeof(sensor_endpoint) - 1;
    req_size += sizeof(temperature) - 1;
    req_size += sizeof(humidity) - 1;
    req_size += sizeof(air_quality) - 1;
    req_size += battery_charge_lenght;
}

void registration_payload(char *get_url, int *req_size) {
    
    strcat(get_url, api_path);
    strcat(get_url, get_imei());
    strcat(get_url, registration_endpoint);

    req_size += sizeof(api_path) - 1;
    req_size += device_imei_lenght;
    req_size += sizeof(registration_endpoint) - 1;    

}

void alert_payload(char *get_url, int *req_size) {

    // Make paylaod from char arrays
    strcat(get_url, api_path);
    strcat(get_url, get_imei());
    strcat(get_url, alert_endpoint);

    req_size += sizeof(api_path) - 1;
    req_size += device_imei_lenght;
    req_size += sizeof(alert_endpoint) - 1;   
}

void status_payload(char *get_url, int *req_size) {

    char ss_true[] = "/systemStatus/true";
    char ss_false[] = "/systemStatus/false";

    // Make paylaod from char arrays
    strcat(get_url, api_path);
    
    //strcat(get_url, "123456789012345");
    strcat(get_url, get_imei());

    if (get_system_armed())
    {
        strcat(get_url, ss_true);
        req_size = 0;
        req_size += sizeof(api_path) - 1;
        req_size += device_imei_lenght;
        req_size += sizeof(ss_true) - 1;

    } else {
        strcat(get_url, ss_false);
        req_size = 0;
        req_size += sizeof(api_path) - 1;
        req_size += device_imei_lenght;
        req_size += sizeof(ss_false) - 1;
    }
}