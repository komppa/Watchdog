#include <zephyr.h>
#include <math.h>
#include <stdio.h>
#include <device.h>
#include <drivers/sensor.h>
#include "movement.h"
#include "led.h"
#include "settings.h"

#define abs (x) ((x) < 0 ? -(x) : (x))
#define UPPER_THRESH 150
#define LOWER_THRESH 1000

#define CALIB_TIMES 200
#define DEFAULT_MIN_VALUE -100
#define DEFAULT_MAX_VALUE 100

static struct sensor_value accel[3];
static struct device *accel_dev;
static struct calib_data c_data[CALIB_TIMES];
static struct calib_data accel_data; // For keskiarvo

static double avg_x, avg_y, avg_z = 0;

bool trigger_valid(void)
{
    /*
    // Returnable status, true if movement was correct
    double x_val, y_val, z_val = 1;
    sensor_sample_fetch(accel_dev);

    sensor_channel_get(accel_dev, SENSOR_CHAN_ACCEL_X, &accel[0]);
    sensor_channel_get(accel_dev, SENSOR_CHAN_ACCEL_Y, &accel[1]);
    sensor_channel_get(accel_dev, SENSOR_CHAN_ACCEL_Z, &accel[2]);

    x_val = fabs(sensor_value_to_double(&accel[0]));
    y_val = fabs(sensor_value_to_double(&accel[1]));
    z_val = fabs(sensor_value_to_double(&accel[2]));
   
    double errcor = 0.7;
    double z_errcor = 1.0;

    if (
        x_val > accel_data.x_max + errcor || 
            (x_val < accel_data.x_min - errcor && 
            accel_data.x_max != DEFAULT_MAX_VALUE)) 
    {
        return true;
    }

    if (y_val > accel_data.y_max + errcor || 
            (y_val < accel_data.y_min - errcor && 
            accel_data.x_max != DEFAULT_MAX_VALUE))
    {
        return true;
    }

    if (z_val > accel_data.z_max + z_errcor || 
            (z_val < accel_data.z_min - z_errcor && 
            accel_data.x_max != DEFAULT_MAX_VALUE))
    {
        return true;
    }

    return false;
    */
}

void calibrate_movement(void)
{
    printk("Calibrating...\n");

    k_msleep(1000);
    /*

    double x, y, z;
    double curr_x_max, curr_y_max, curr_z_max = 0;
    double curr_x_min, curr_y_min, curr_z_min = 0;

    // Get values to c_value array
    for (int i = 0; i < CALIB_TIMES; i++) 
    {
        
        sensor_sample_fetch(accel_dev);
        sensor_channel_get(accel_dev, SENSOR_CHAN_ACCEL_X, &accel[0]);
        sensor_channel_get(accel_dev, SENSOR_CHAN_ACCEL_Y, &accel[1]);
        sensor_channel_get(accel_dev, SENSOR_CHAN_ACCEL_Z, &accel[2]);

        x = fabs(sensor_value_to_double(&accel[0]));
        y = fabs(sensor_value_to_double(&accel[1]));
        z = fabs(sensor_value_to_double(&accel[2]));

        
        if (i == 0)
        {
            curr_x_max = x;
            curr_y_max = y;
            curr_z_max = z;
            
            curr_x_min = x;
            curr_y_min = y;
            curr_z_min = z;

        }
        

        c_data[i].x = x;
        c_data[i].y = y;
        c_data[i].z = z;

        if (x > curr_x_max) curr_x_max = x;
        if (y > curr_y_max) curr_y_max = y;
        if (z > curr_z_max) curr_z_max = z;

        if (x < curr_x_min) curr_x_min = x;
        if (y < curr_y_min) curr_y_min = y;
        if (z < curr_z_min) curr_z_min = z;

        if ((i % 10) == 0) {
            flashLed(0);    
        }

        k_msleep(50);
        
    }

    // Put max and mins to struct
    accel_data.x_max = curr_x_max;
    accel_data.y_max = curr_y_max;
    accel_data.z_max = curr_z_max;

    accel_data.x_min = curr_x_min;
    accel_data.y_min = curr_y_min;
    accel_data.z_min = curr_z_min;


    // Calculate average 

    for (int i = 0; i < CALIB_TIMES; i++) 
    {
        avg_x += c_data[i].x;
        avg_y += c_data[i].y;
        avg_z += c_data[i].z;
    }

    accel_data.x = avg_x / CALIB_TIMES;
    accel_data.y = avg_y / CALIB_TIMES;
    accel_data.z = avg_z / CALIB_TIMES;
    */
}

void trigger_handler(struct device *accel_dev, struct sensor_trigger *trig)
{
    printk("@trigger_handler\n");    
    /*  
    switch (trig->type) {
	case SENSOR_TRIG_THRESHOLD:
		printf("Threshold trigger\n");
        // Checks if alert should be triggered
        if (trigger_valid() && get_system_armed() && alert_interval_valid())
        {
            slowFlashLed(2);
            printk("ALERT TRIGGERED! \n");

            set_alert_pending(true);
            
        }  else {

            if (trigger_valid() && !get_system_armed() && alert_interval_valid()) {
                // Trigger was valid but system isn't armed
            }
        }
		break;
	default:
		printf("Unknown trigger\n");
	}
    */
}

void init_movement(void)
{
    /*
	accel_dev = device_get_binding(DT_LABEL(DT_INST(0, adi_adxl362)));
	if (accel_dev == NULL) {
		printf("Adxl362 binding failed\n");
		return;
	} else {
        printk("Adxl362 binded successfully\n");
    }

	if (IS_ENABLED(CONFIG_ADXL362_TRIGGER)) {
		struct sensor_trigger trig = { .chan = SENSOR_CHAN_ACCEL_XYZ };
		trig.type = SENSOR_TRIG_THRESHOLD;
		if (sensor_trigger_set(accel_dev, &trig, trigger_handler)) {
			printf("Trigger set error\n");
			return;
		} else {
			printk("Trigger set \n");
		}
	}
	
    struct sensor_value new_lower = {LOWER_THRESH, 0};
	struct sensor_value new_upper = {UPPER_THRESH, 0};
	
	int sas_status = sensor_attr_set(accel_dev, SENSOR_CHAN_ACCEL_X, SENSOR_ATTR_LOWER_THRESH, &new_lower);
	sas_status = sensor_attr_set(accel_dev, SENSOR_CHAN_ACCEL_X, SENSOR_ATTR_UPPER_THRESH, &new_upper);
    
    accel_data.x_max = DEFAULT_MAX_VALUE;
    accel_data.y_max = DEFAULT_MAX_VALUE;
    accel_data.z_max = DEFAULT_MAX_VALUE;
	
    accel_data.x_min = DEFAULT_MIN_VALUE;
    accel_data.y_min = DEFAULT_MIN_VALUE;
    accel_data.z_min = DEFAULT_MIN_VALUE;
    */
}
