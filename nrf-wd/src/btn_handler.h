#include <zephyr.h>
#include <device.h>
#include <drivers/gpio.h>
#include <sys/util.h>
#include <inttypes.h>

bool get_btn_act_pending(void);
void set_btn_act_pending(bool);

void setBtnDownTime(void);
void setBtnUpTime(void);
int calcBtnTime(void);

