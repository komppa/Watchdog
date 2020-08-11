#include <string.h>
#include <zephyr.h>
#include <stdlib.h>
#include <stdio.h>
#include <modem/at_cmd.h>
#include <net/socket.h>
#include <nrf_errno.h>
#include <modem/at_notif.h>

char* get_imei(void);
void init_mag(void);
void at_substring(char*, int, int);
void at_error_handler(int, char*);
void get_device_imei(void);
char* get_device_battery_charge(void);
int get_battery_charge(void);
int get_battery_level(void);