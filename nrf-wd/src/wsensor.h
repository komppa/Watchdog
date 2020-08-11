#include <zephyr.h>
#include <device.h>
#include <drivers/sensor.h>
#include <stdio.h>

void init_bme680(void);
int get_temperature(void);
int get_humidity(void);