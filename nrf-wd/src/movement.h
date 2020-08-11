#include <zephyr.h>
#include <stdio.h>
#include <device.h>
#include <drivers/sensor.h>

// Calibration data
struct calib_data 
{
    double x;
    double y;
    double z;

    double x_max;
    double y_max;
    double z_max;

    double x_min;
    double y_min;
    double z_min;
};

bool trigger_valid(void);
void calibrate_movement(void);
void trigger_handler(struct device*, struct sensor_trigger*);
void init_movement(void);

