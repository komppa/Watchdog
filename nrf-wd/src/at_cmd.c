#include <string.h>
#include <zephyr.h>
#include <stdlib.h>
#include <stdio.h>
#include <modem/at_cmd.h>
#include <net/socket.h>
#include <nrf_errno.h>
#include <modem/at_notif.h>
#include "at_cmd.h"

#define SPACE 0
#define QUOTE 1

// For logging
// LOG_MODULE_REGISTER(main, LOG_LEVEL_DBG);

static char device_imei[50];
static char device_battery_charge[15];

char* get_imei(void) {
    return device_imei;
}

void init_mag(void) {

    int err;

    err = at_cmd_write(
        "AT%XMAGPIO=1,1,1,7,1,746,803,2,698,748,2,1710,2200,3,824,894,4,880,960,5,791,849,7,1574,1577", NULL, 0, NULL
    );

    if (err) {
        printk("Failed to set MAGPIO, err %d\n", err);
    }

}


// Get values from modem without prefix
void at_substring(char *char_array, int char_array_size, int separator) {
    
    char *p;
    char *sep;
    int offset;
    
    if (separator == 1) {
        sep = "\"";
        offset = 15;
    } else {
        sep = " ";
        offset = 4;
    }
   
    p = strstr(char_array, sep);
    if (p != NULL) {
        strcpy(char_array, p + 1);
        char_array[offset] = '\0';
    } else {
        printk("Couldn't parse values out of modem's buffer\n");
        return;
    }
}

void at_error_handler(int err_code, char *command) {
    if (err_code == 0) {
        printk("AT command executed succesfully for %s\n", command);
    } else {
        printk("AT command execution failed when exec. command %s\n", command);
    }
}

// Get device's IMEI from modem using +CGSN
void get_device_imei(void)
{
    int buffer_size = 50;
    char rec_buf[50];
    const char e_command[] = "AT+CGSN=1"; // IMEI
	enum at_cmd_state state;

	int ret = at_cmd_write(e_command, rec_buf, buffer_size, &state);
    at_error_handler(ret, e_command);
    at_substring(rec_buf, 50, QUOTE);
    rec_buf[strlen(rec_buf)] = '\0';
    strcpy(device_imei, rec_buf);
}

// Get device's battery voltage from modem using %XVBAT
char* get_device_battery_charge(void)
{
    int buffer_size = 15;
	const char e_command[9] = "AT%XVBAT"; // BATT
	enum at_cmd_state state;
	int ret = at_cmd_write(e_command, device_battery_charge, buffer_size, &state);
    at_error_handler(ret, e_command);
    at_substring(device_battery_charge, 15, SPACE);
    return device_battery_charge;
}

// Get battery charge as integer
int get_battery_charge(void) 
{

    char *battery_charge;
    int battery_charge_int;
    
    battery_charge = get_device_battery_charge();
    battery_charge_int = atoi(battery_charge);

    return battery_charge_int;
}

int get_battery_level(void)
{

    int charge;
    int limit_values[2] = {3483, 3966};
    charge = get_battery_charge();
    for (int x = 0; x < (sizeof(limit_values) / sizeof(limit_values[0])); x++)
    {
        if (charge < limit_values[x]) { return x; }
    }
    // There weren't value less that charge, its max value then
    return (sizeof(limit_values) / sizeof(limit_values[0]));
}


// For enabling GPS
char* system_mode_gps(void)
{
    int buffer_size = 15;
	const char e_command[23] = "AT%XSYSTEMMODE=0,0,1,0"; // BATT
	enum at_cmd_state state;
	int ret = at_cmd_write(e_command, device_battery_charge, buffer_size, &state);
	printk("Err code: %d\n", ret);
    //at_error_handler(ret, e_command);
    //at_substring(device_battery_charge, 15, SPACE);
    return device_battery_charge;
}

char* system_mode_lte(void)
{
	
	printk("@system_mode_lte \n");
	
    int buffer_size = 15;
	const char e_command[23] = "AT%XSYSTEMMODE=1,0,1,0"; // BATT
	enum at_cmd_state state;
	int ret = at_cmd_write(e_command, device_battery_charge, buffer_size, &state);
	printk("Err code: %d\n", ret);
    //at_error_handler(ret, e_command);
    //at_substring(device_battery_charge, 15, SPACE);
    return device_battery_charge;
}

// For putting GPS action
char* cfun_zero(void)
{
    int buffer_size = 15;
	const char e_command[10] = "AT+CFUN=0"; // BATT
	enum at_cmd_state state;
	int ret = at_cmd_write(e_command, device_battery_charge, buffer_size, &state);
	printk("Err code: %d\n", ret);
    //at_error_handler(ret, e_command);
    //at_substring(device_battery_charge, 15, SPACE);
    return device_battery_charge;
}

char* cfun_one(void)
{
    int buffer_size = 15;
	const char e_command[10] = "AT+CFUN=1"; // BATT
	enum at_cmd_state state;
	int ret = at_cmd_write(e_command, device_battery_charge, buffer_size, &state);
	printk("Err code: %d\n", ret);
    //at_error_handler(ret, e_command);
    //at_substring(device_battery_charge, 15, SPACE);
    return device_battery_charge;
}

char* cfun_31(void)
{
    int buffer_size = 15;
	const char e_command[10] = "AT+CFUN=31"; // BATT
	enum at_cmd_state state;
	int ret = at_cmd_write(e_command, device_battery_charge, buffer_size, &state);
	printk("Err code: %d from CFUN31\n", ret);
    //at_error_handler(ret, e_command);
    //at_substring(device_battery_charge, 15, SPACE);
    return device_battery_charge;
}
