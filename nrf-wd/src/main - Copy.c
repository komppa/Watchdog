#include <string.h>
#include <zephyr.h>
#include <stdlib.h>
#include <device.h>
#include <drivers/gpio.h>
#include <sys/util.h>
#include <inttypes.h>
#include "led.h"
#include "movement.h"
#include "payloads.h"
#include "settings.h"
#include "http_request.h"
#include "wsensor.h"
#include "at_cmd.h"
#include "btn_handler.h"

#define IMEI_LENGHT 15
#define SENSOR_RETRY_TIMES 2
#define REGISTRATION_RETRY_TIMES 3
#define STATUS_RETRY_TIMES 3
#define ALERT_RETRY_TIMES 9
#define SPACE 32
#define QUOTE 34
#define REQ_RETRIES 5

#define FLAGS_OR_ZERO(node) \
    COND_CODE_1(DT_PHA_HAS_CELL(node, gpios, flags),    \
    (DT_GPIO_FLAGS(node, gpios)),   \
    (0))

#define SW0_NODE	DT_ALIAS(sw0)

#if DT_NODE_HAS_STATUS(SW0_NODE, okay)
#define SW0_GPIO_LABEL	DT_GPIO_LABEL(SW0_NODE, gpios)
#define SW0_GPIO_PIN	DT_GPIO_PIN(SW0_NODE, gpios)
#define SW0_GPIO_FLAGS	(GPIO_INPUT | FLAGS_OR_ZERO(SW0_NODE))
#else
#error "Unsupported board: sw0 devicetree alias is not defined"
#define SW0_GPIO_LABEL	""
#define SW0_GPIO_PIN	0
#define SW0_GPIO_FLAGS	0
#endif

static struct gpio_callback button_cb_data;
// For http requests, req_response contains whole response (header + message) and req_res_content only msg
char req_response[2048];
char req_res_content[2048];

/* Check button's state when button has been pressed or released */
void button_pressed(struct device *dev, struct gpio_callback *cb, u32_t pins)
{
    u32_t btn_high; // Timestamp when button pressed
    
    int pin_status = gpio_pin_read(dev, SW0_GPIO_PIN, &btn_high);
    if (pin_status != 0) printk("There is something wrong with the gpio_pin_read function :(");

    if (btn_high == 1) {
        setBtnDownTime();
    } else {
        setBtnUpTime();
        set_btn_act_pending(true); // Flag for button
    }
}

/* Send sensor data to the server */
void send_sensor(void) 
{    
    static int retry_times = 0;

    send_request(req_response, SENSOR_DATA);
    //const char req_response[51] = "{\"status\":\"Success\",\"armed\":true,\"ci\":123}";

    bool status = parse_response(req_response);
   
    if (!status) {

        if (retry_times == REQ_RETRIES) {
            return;
        }

        printk("Error has occurred! @sensor data sending\n");
        printk("Waiting fto 10s. to try again sending payload and parsing the response...\n");
        k_msleep(2000);
        retry_times++;
        printk("Retry times: %d\n", retry_times);
        send_sensor();

    } else {
        retry_times = 0;
    }
    


}

/* Send registration request to the server */
void request_registration(void)
{
    send_request(req_response, REGISTRATION_DATA);
    parse_response(req_response);

}

/* Trigger alert */
void trigger_alert(void)
{
    send_request(req_response, ALERT_DATA);
    parse_response(req_response);

}

/* Change system's current armed status and send it to the server */
void system_status(void)
{
    // Change system status opposite
    toggle_system_armed();

    send_request(req_response, ARM_DATA);
    parse_response(req_response);

    if (!get_system_armed()) {
        for (int x = 0; x < 3; x++) {
            slowFlashLed(1);
        }
    } else {
        calibrate_movement();
    }   
}


void main(void)
{
    bool first_time = true; // Sensor data won't be trasmitted on start up right away
    struct device *button;
	int ret;
    int battery_charge;
    
    /* Inits */
    init_mag();   // Set MAGPIO for Thingy
    init_led();
    init_movement();
    init_bme680();
    init_http_request();
    get_device_imei();  // Get device's IMEI on startup that it can be accessible using get_imei()

    /* System inits */
    set_system_armed(false);    // On default, system status will be disarmed
    set_alert_interval(2);  // Interval how often alert can trigger
    set_alert_pending(false);

    // Thingy:91's onboard button
    button = device_get_binding(SW0_GPIO_LABEL);
	if (button == NULL) {
		printk("Error: didn't find %s device\n", SW0_GPIO_LABEL);
	}

	ret = gpio_pin_configure(button, SW0_GPIO_PIN, SW0_GPIO_FLAGS);
	if (ret != 0) {
		printk("Error %d: failed to configure %s pin %d\n",
		       ret, SW0_GPIO_LABEL, SW0_GPIO_PIN);
	}

	ret = gpio_pin_interrupt_configure(button, SW0_GPIO_PIN, GPIO_INT_EDGE_BOTH);
	if (ret != 0) {
		printk("Error %d: failed to configure interrupt on %s pin %d\n",
			ret, SW0_GPIO_LABEL, SW0_GPIO_PIN);
	}

    // Assign callbacks for onboard button
	gpio_init_callback(&button_cb_data, button_pressed, BIT(SW0_GPIO_PIN));
	gpio_add_callback(button, &button_cb_data);

    // Send sensor data immediately when Thginy has started
    send_sensor();

    // If system's status is disarmed at startup, show green light to the user
    if (!get_system_armed()) {
        for (int x = 0; x < 3; x++) {
            slowFlashLed(1);
        }
    }
    
    while (1) 
    {
        //  * If button action from user is pending *
        if (get_btn_act_pending()) 
        {
            switch (calcBtnTime()) {
                case 1: 
                    // Short press -> show battery charge
                    switch (get_battery_level())
                    {
                        case 0:
                            slowFlashLed(0);
                            break;
                        case 1:
                            slowFlashLed(3); // Yellow
                            break;
                        case 2:
                            slowFlashLed(1);
                            break;
                        default:
                            break;
                    }
                    break;

                case 2: 
                    // Hold -> change system's status
                    slowFlashLed(3);
                    system_status();
                    break;

                case 3: 
                    // Long hold -> send registration request
                    slowFlashLed(2);
                    slowFlashLed(2);
                    slowFlashLed(2);
                    request_registration();
                    break;

                default:
                   break;
            }
        }
        
        // Action has been executed, resetting flag to false
        set_btn_act_pending(false);


        // If new alert is pending on queue
        if (alert_pending())
        {
            trigger_alert();
            set_alert_pending(false);   // Reset alert flag
        }

        
        //  If it is time to send another sensor packet
        
        if ((k_uptime_get() - get_sensor_data_last_sent()) > ( get_connection_interval() * 1000 )) 
        {
            if (!first_time) 
            {
                set_sensor_data_last_sent(k_uptime_get());
                send_sensor();

            } else 
            {
                // Don't send sensor data if device just got started
                set_sensor_data_last_sent(k_uptime_get());
                first_time = false;
            }
        }

        k_msleep(200);
    }
}