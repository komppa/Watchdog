#include <zephyr.h>
#include <device.h>
#include <drivers/sensor.h>
#include <stdio.h>
#include "wsensor.h"

static struct device *dev;
static struct sensor_value temp, humidity;

void init_bme680(void) {
    //dev = device_get_binding(DT_LABEL(DT_INST(0, bosch_bme680)));
    //printf("Device %p name is %s and it has been initialized \n", dev, dev->name);
}

int get_temperature(void) {
    /*
    // Check if bme680 has been initialized
    if (!dev) {
        init_bme680();
    }
    
    int t_integer;
    int t_decimal;
    int temperature;

    sensor_sample_fetch(dev);
    sensor_channel_get(dev, SENSOR_CHAN_AMBIENT_TEMP, &temp);

    t_integer = temp.val1 * 10;
    t_decimal = temp.val2 / 100000;
    temperature = t_integer + t_decimal;

    return temperature;
    */
    return 240;
}

int get_humidity(void) {

    /*
    if (!dev) {
        init_bme680();
    }
    
    sensor_sample_fetch(dev);
    sensor_channel_get(dev, SENSOR_CHAN_HUMIDITY, &humidity);

    return humidity.val1;
    */

    return 31;
}
