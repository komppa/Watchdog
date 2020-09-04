#include <string.h>
#include <zephyr.h>
#include <stdlib.h>
#include "settings.h"

enum {
    SENSOR_DATA,
    REGISTRATION_DATA,
    ALERT_DATA,
    ARM_DATA,
	LOCATION_DATA
};

void create_payload(char *final_send_buf, char *get_url, int get_url_size);
void sensor_payload(char*, int*);
void registration_payload(char*, int*);
void alert_payload(char*, int*);
void status_payload(char*, int*);
void location_payload(char*, int*);