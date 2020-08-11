#include <zephyr.h>
#include <device.h>
#include <devicetree.h>
#include <drivers/gpio.h>

enum {
    RED,
    GREEN,
    BLUE
};

void init_led(void);
void toggle_led(int color, int state);
void blink_led(int color, int steady_time);
void flashLed(int color);
void slowFlashLed(int color);