#include <zephyr.h>
#include <device.h>
#include <drivers/gpio.h>
#include <sys/util.h>
#include <inttypes.h>
#include "btn_handler.h"

// Times for button up and down
static s64_t start_time = 0;
static s64_t end_time = 0;

static bool btn_act_pending = 0;

bool get_btn_act_pending(void)
{
	return btn_act_pending;
}

void set_btn_act_pending(bool new_value)
{
	btn_act_pending = new_value;
}

void setBtnDownTime(void) 
{
    start_time = k_uptime_get();
}

void setBtnUpTime() 
{
    end_time = k_uptime_get();
}

int calcBtnTime() 
{
    int action;
    s64_t hold_time = (end_time - start_time);

    // Which action must be executed
    if (hold_time >= 7000){
        action = 3;
    } else if (hold_time >= 2000 && hold_time < 5500) {
        action = 2;
    } else if (hold_time > 300 && hold_time < 1500) {
        action = 1;
    } else { action = 0; }
    
    return action;    
}

