#include <zephyr.h>
#include <device.h>
#include <devicetree.h>
#include <drivers/gpio.h>
#include "led.h"

#define LED0_NODE DT_ALIAS(led0) // R
#define LED1_NODE DT_ALIAS(led1) // G
#define LED2_NODE DT_ALIAS(led2) // B

#define LED_RED     DT_GPIO_LABEL(LED0_NODE, gpios)
#define LED_GREEN	DT_GPIO_LABEL(LED1_NODE, gpios)
#define LED_BLUE	DT_GPIO_LABEL(LED2_NODE, gpios)

#define PIN_RED     DT_GPIO_PIN(LED0_NODE, gpios)
#define PIN_GREEN	DT_GPIO_PIN(LED1_NODE, gpios)
#define PIN_BLUE	DT_GPIO_PIN(LED2_NODE, gpios)

#ifndef FLAGS
#define FLAGS	0
#endif

struct device *led_dev;

void init_led(void) {

	int ret;
    
    // Binding device
	led_dev = device_get_binding(LED_RED);
	if (led_dev == NULL) {
        printk("Couldn't get device binding for LED0");
		return;
	}

    // Configure red
	ret = gpio_pin_configure(led_dev, PIN_RED, GPIO_OUTPUT_ACTIVE | FLAGS);
	if (ret < 0) {
        printk("Couldn't configure device LED0");
		return;
	}

    // Configure green
    ret = gpio_pin_configure(led_dev, PIN_GREEN, GPIO_OUTPUT_ACTIVE | FLAGS);
	if (ret < 0) {
        printk("Couldn't configure device LED1");
		return;
	}

    // Configure blue
    ret = gpio_pin_configure(led_dev, PIN_BLUE, GPIO_OUTPUT_ACTIVE | FLAGS);
	if (ret < 0) {
        printk("Couldn't configure device LED2");
		return;
	}

    // Sets all leds off on startup
    gpio_pin_set(led_dev, PIN_GREEN, 0);
    gpio_pin_set(led_dev, PIN_RED, 0);
    gpio_pin_set(led_dev, PIN_BLUE, 0);

}

// Set selected LED on or off 
void toggle_led(int color, int state) {
    switch (color)
    {
        case 0:
            gpio_pin_set(led_dev, PIN_RED, state);
            break;
        case 1:
            gpio_pin_set(led_dev, PIN_GREEN, state);
            break;
        case 2:
            gpio_pin_set(led_dev, PIN_BLUE, state);
            break;
        default:
            // On default turn all leds off
            gpio_pin_set(led_dev, PIN_RED, 0);
            gpio_pin_set(led_dev, PIN_GREEN, 0);
            gpio_pin_set(led_dev, PIN_BLUE, 0);
    }
}

void blink_led(int color, int steady_time) {
    int cycle_time = 300;
    // Rising light
    for (int x = 0; x < (cycle_time / 10); x++) {
        
        // If color is yellow or some other taht needs more than one led
        if (color >= 3) {
            // Yellow
            toggle_led(0, 1);
            toggle_led(1, 1);
        } else {
            // R, G or B
            toggle_led(color, 1);
        }
        
        if (x != 0 ) {
            k_msleep(x / 5);
        }

        if (color >= 3) {
            toggle_led(0, 0);
            toggle_led(1, 0);
        } else {
            toggle_led(color, 0);
        }
        
        k_msleep(((cycle_time / 10) - x) / 5);
    }

    // Steady on on middle
    if (color >= 3) {
        toggle_led(0, 1);
        toggle_led(1, 1);
    } else {
        toggle_led(color, 1);
    }
    
    
    k_msleep(steady_time);

    // Falling light
    for (int x = (cycle_time / 10); x > 0; x--) {
        if (x == 0 ) {printk("FALLINGISA ON NOLA");}
        toggle_led(color, 1);
        if (x != 0 ) {
            k_msleep(x / 5);
        }
        toggle_led(color, 0);
        k_msleep(((cycle_time / 10) - x) / 5);
    }

    // Wait a little bit on end of flash
    k_msleep(200);
}

// Fast flash
void flashLed(int color) {
    blink_led(color, 10);
}

// Slow flash
void slowFlashLed(int color) {
    blink_led(color, 500);
}