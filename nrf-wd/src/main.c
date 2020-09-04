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

// GPS
#include <nrf_socket.h>
#include <net/socket.h>
#include <stdio.h>
#include <string.h>
#include <drivers/gps.h>
#include <math.h>

// Network init
#include <modem/lte_lc.h>

#ifdef CONFIG_SUPL_CLIENT_LIB
#include <supl_os_client.h>
#include <supl_session.h>
#include "supl_support.h"
#endif

#define GNSS_INIT_AND_START 1
#define GNSS_STOP           2
#define GNSS_RESTART        3

#define GPS_DEVICE "NRF9160_GPS"

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

static void send_sensor(void);
static void request_registration(void);
static void trigger_alert(void);
static void system_status(void);
static void send_location(void);

LOG_MODULE_REGISTER(main, LOG_LEVEL_DBG);

static struct gpio_callback button_cb_data;

/* 
    For http requests, req_response contains whole response 
    (header + message) and req_res_content only msg
*/
char req_response[2048];
char req_res_content[2048];

struct device *gps_dev;

void gps_event_handler(struct device *dev, struct gps_event *evt)
{
	int err;

	if (evt->type == GPS_EVT_PVT_FIX)
	{
        set_location(evt->pvt.latitude, evt->pvt.longitude);
        // When location sent to the server, reset gps_searching flag
        set_gps_searching(false);
        set_send_gps_location(true);
	}
	
	if (evt->type == GPS_EVT_AGPS_DATA_NEEDED) {
		err = open_supl_socket();
		if (err == 0) {
			printk("SUPL socket opened succesfully\n");
		} else {
			printk("Opening SUPL socket failed! Err: %d\n", err);
		}
		int status = supl_session(&evt->agps_request);
	}

    if (evt->type == GPS_EVT_SEARCH_TIMEOUT) {
        set_location(0, 0); // Zeros means no fix
        set_gps_searching(false);
        set_send_gps_location(true);
    }
}

#ifdef CONFIG_SUPL_CLIENT_LIB
int inject_agps_type(void *agps, size_t agps_size, nrf_gnss_agps_data_type_t type, void *user_data)
{
	
	ARG_UNUSED(user_data);
	int retval = 0;
	
	// Mapping data types
	switch (type) {
		case NRF_GNSS_AGPS_UTC_PARAMETERS:
			type = GPS_AGPS_UTC_PARAMETERS;
			break;
		case NRF_GNSS_AGPS_EPHEMERIDES:
			type = GPS_AGPS_EPHEMERIDES;
			break;
		case NRF_GNSS_AGPS_ALMANAC:
			type = GPS_AGPS_ALMANAC;
			break;
		case NRF_GNSS_AGPS_KLOBUCHAR_IONOSPHERIC_CORRECTION:
			type = GPS_AGPS_KLOBUCHAR_CORRECTION ;
			break;
		case NRF_GNSS_AGPS_NEQUICK_IONOSPHERIC_CORRECTION:
			type = GPS_AGPS_NEQUICK_CORRECTION ;
			break;
		case NRF_GNSS_AGPS_GPS_SYSTEM_CLOCK_AND_TOWS:
			type = GPS_AGPS_GPS_SYSTEM_CLOCK_AND_TOWS;
			break;
		case NRF_GNSS_AGPS_LOCATION:
			type = GPS_AGPS_LOCATION;
			break;
		case NRF_GNSS_AGPS_INTEGRITY:
			type = GPS_AGPS_INTEGRITY;
			break;
		default:
			return -1;
	}
	
	retval = gps_agps_write(
				gps_dev,	// dev Pointer to GPS device
				type,		// type A-GPS data type
				agps,		// data Pointer to A-GPS data
				sizeof(agps)
	);

	if (retval != 0) {
		printk("Failed to send AGNSS data, type: %d (err: %d)\n",
		       type,
		       errno);
		return -1;
	}

	printk("Injected AGPS data, flags: %d, size: %d\n", type, agps_size);

	return 0;
}
#endif

/* Check button's state when button has been pressed or released */
void button_pressed(struct device *dev, struct gpio_callback *cb, u32_t pins)
{
    u32_t btn_high = 0; // Timestamp when button pressed
    
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
    send_request(req_response, SENSOR_DATA);
    parse_response(req_response);
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

/* Send location to the server */
void send_location()
{
    send_request(req_response, LOCATION_DATA);
    parse_response(req_response);
}

void main(void)
{
   	int err;	
	bool first_time = true; // Sensor data won't be trasmitted on start up right away
    struct device *button;
	int ret;
    
    /* Inits */
    
    // SUPL init before GPS start
    static struct supl_api supl_api = {
        .read       = supl_read,	// supl_support
        .write      = supl_write,	// supl_support
        .handler    = inject_agps_type,	// this file
        .logger     = supl_logger,	// supl_support
        .counter_ms = k_uptime_get
    };
		
	// GPS start
	struct gps_config conf = {
		.nav_mode = GPS_NAV_MODE_SINGLE_FIX ,
		.power_mode = GPS_POWER_MODE_DISABLED,
		.interval = 0,
		.timeout = 120,  // FOR DEV PURPOSES - CHANGE TO 360
		.delete_agps_data = false
	};	
   
    // Enabling PSM
    lte_lc_psm_req(true); 
	
    
    // Connect Thingy to the network
    /*
	printk("Waiting for network..\n");	
	err = lte_lc_init_and_connect();
	if (err) {
        if (err == -120) {
            printk("Device has established connection already to network. \n");
        } else {
            printk("Failed to connect to the LTE network, err %d\n", err);
            return;
        }
		
	}
    
	printk("Connected to the network! \n");
    */

    init_led();
    //init_movement();
    //init_bme680();
    init_http_request();
    // Get device's IMEI on startup that it can be accessible using get_imei()
    get_device_imei();  
    /* System var inits */
    set_system_armed(false);    // On default, system status will be disarmed
    set_alert_interval(30);  // Interval how often alert can trigger
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


    // GPS
    gps_dev = device_get_binding(GPS_DEVICE);
	if (gps_dev == NULL) {
		printk("Could not get %s device\n", GPS_DEVICE);
		return;
	}

	printk("Initting SUPL ! \n");
	int rc = supl_init(&supl_api);	// function from supl_os_clie   nt.h
	if (rc != 0) {
		return;
	} else {
		printk("SUPL INIT returned %d ! \n", rc);
	}
	    
	printk("Initting GPS ! \n");
	err = gps_init(gps_dev, gps_event_handler);
	if (err) {
		printk("Err with gps_init\n");
	} else {
		printk("Initialized GPS succesfully ! \n");
	}

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

        // Button action pending
        if (get_btn_act_pending()  && !get_http_request_executing()) 
        {
            // Handle button only if GPS is not active
            if (!get_gps_searching()) {
                printk("GPS not active - handling button presss\n");
                set_btn_act_pending(false);
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
        }
        

        // Alert pending
        if (alert_pending() && !get_http_request_executing())
        {
            if (!get_gps_searching()) {
                
                set_alert_pending(false);
                trigger_alert();

                // Check if user wants location data after alert
                if (get_location_on_alert()) {
                    set_search_gps_location(true);
                }

            }
        }


        // Get location from GPS pending
        if (get_search_gps_location() && !get_http_request_executing()) {

            if (!get_gps_searching()) {
                // If GPS is not reserved already and location on alert is true

                err = gps_start(gps_dev, &conf);
            
                if (err) {
                    printk("Err with gps_start \n");
                } else {
                    // On success, reserve GPS
                    set_search_gps_location(false);
                    set_gps_searching(true);
                }

            }
        }

        if (get_send_gps_location() && !get_http_request_executing()) {
            set_send_gps_location(false);
            send_location();


        }

        
        // Sensor data sending pending        
        if ((k_uptime_get() - get_sensor_data_last_sent()) > ( get_connection_interval() * 1000 )) 
        {
            if (!first_time) 
            {
                // Set new timestamp in anycase - sensor data not so important that missing packets are allowed
                set_sensor_data_last_sent(k_uptime_get());

                // Don't send sensor data if GPS is searching
                if (!get_gps_searching()) {

                    if (!get_http_request_executing()) {
                        send_sensor();
                    }
                }
                

            } else {
                // Don't send sensor data if device just got started
                set_sensor_data_last_sent(k_uptime_get());
                first_time = false;
            }
        }

        
        k_msleep(500);
    }
    
}