/*
 * Copyright (c) 2020 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-BSD-5-Clause-Nordic
 */

 // TODO at_notif: Already initialized. Nothing to do


#include <string.h>
#include <zephyr.h>
#include <stdlib.h>
#include <net/socket.h>
#include <modem/bsdlib.h>
#include <net/tls_credentials.h>
#include <modem/lte_lc.h>
#include <modem/at_cmd.h>
#include <modem/at_notif.h>
#include <modem/modem_key_mgmt.h>

#include <math.h>
#include <stdint.h>
#include <stdio.h>

#include "led.h"


#include "http_request.h"

#define HTTPS_PORT 443

#define HTTP_HEAD                                       \
	"GET HTTP/1.1\r\n"   \
	"Host: watchdog.rantakangas.com:443\r\n"                  \
	"Connection: close\r\n\r\n"



#define HTTP_HEAD_LEN (sizeof(final_send_buf) - 1)




#define HTTP_HDR_END "\r\n\r\n"

#define RECV_BUF_SIZE 2048
#define TLS_SEC_TAG 42

static const char send_buf[] = HTTP_HEAD;
static char recv_buf[RECV_BUF_SIZE];

/* Certificate for `*.rantakangas.com` */
static const char cert[] = {
	#include "../cert/GlobalSign-Root-CA-R2"
};

BUILD_ASSERT(sizeof(cert) < KB(4), "Certificate too large");

int get_recv_buf_size(void)
{
    return RECV_BUF_SIZE;
}

/* Initialize AT communications */
int at_comms_init(void)
{
	int err;

	err = at_cmd_init();
	if (err) {
		printk("Failed to initialize AT commands, err %d\n", err);
		return err;
	}

	err = at_notif_init();
	if (err) {
		printk("Failed to initialize AT notifications, err %d\n", err);
		return err;
	}

	return 0;
}

/* Provision certificate to modem */
int cert_provision(void)
{
	int err;
	bool exists;
	u8_t unused;

	err = modem_key_mgmt_exists(TLS_SEC_TAG,
				    MODEM_KEY_MGMT_CRED_TYPE_CA_CHAIN,
				    &exists, &unused);
	if (err) {
		printk("Failed to check for certificates err %d\n", err);
		return err;
	}

	if (exists) {
		/* For the sake of simplicity we delete what is provisioned
		 * with our security tag and reprovision our certificate.
		 */
		err = modem_key_mgmt_delete(TLS_SEC_TAG,
					    MODEM_KEY_MGMT_CRED_TYPE_CA_CHAIN);
		if (err) {
			printk("Failed to delete existing certificate, err %d\n",
			       err);
		}
	}

	printk("Provisioning certificate\n");

	/*  Provision certificate to the modem */
	err = modem_key_mgmt_write(TLS_SEC_TAG,
				   MODEM_KEY_MGMT_CRED_TYPE_CA_CHAIN,
				   cert, sizeof(cert) - 1);
	if (err) {
		printk("Failed to provision certificate, err %d\n", err);
		return err;
	}

	return 0;
}

/* Setup TLS options on a given socket */
int tls_setup(int fd)
{
	int err;
	int verify;

	/* Security tag that we have provisioned the certificate with */
	const sec_tag_t tls_sec_tag[] = {
		TLS_SEC_TAG,
	};

	/* Set up TLS peer verification */
	enum {
		NONE = 0,
		OPTIONAL = 1,
		REQUIRED = 2,
	};

	verify = REQUIRED;

	err = setsockopt(fd, SOL_TLS, TLS_PEER_VERIFY, &verify, sizeof(verify));
	if (err) {
		printk("Failed to setup peer verification, err %d\n", errno);
		return err;
	}

	/* Associate the socket with the security tag
	 * we have provisioned the certificate with.
	 */
	err = setsockopt(fd, SOL_TLS, TLS_SEC_TAG_LIST, tls_sec_tag,
			 sizeof(tls_sec_tag));
	if (err) {
		printk("Failed to setup TLS sec tag, err %d\n", errno);
		return err;
	}

	return 0;
}

int init_http_request() {
    int err;
    err = bsdlib_init();
	if (err) {
		printk("Failed to initialize bsdlib! Or bsdlib already initialized! \n");
		return err;
	}
}

void create_payload(char *final_send_buf, char *get_url, int get_url_size) {
    
    int y = 0;

    
    
    // "GET_"
    for (int x = 0; x < 4; x++) {
        final_send_buf[x] = send_buf[x];
        y++;
    }

    // payload
    //for (int x = 0; x < sizeof(get_url) - 1; x++) {
    for (int x = 0; x < get_url_size - 1; x++) {
        final_send_buf[y] = get_url[x];
        //printk("x: %d , y: %d , c: %c \n", x, y, get_url[x]);
        y++;
    }
    
    // Add space between get url and host...
    final_send_buf[y] = ' ';
    y++;

    // Rest of http
    for (int x = 0; x < sizeof(send_buf) -1 -4; x++) {
        //printk("%d, %c \n", x, send_buf[x + 4]);
        final_send_buf[y] = send_buf[x + 4];
        y++;
    }

    // Last character!
    final_send_buf[y] = '\0';

}

/*void toArray(int number, char *numberArray)
{
    int n = log10(number) + 1;
    int i;
    //char numberArray = calloc(n, sizeof(char));
    for ( i = 0; i < n; ++i, number /= 10 )
    {
        numberArray[i] = number % 10;
    }
    //return numberArray;
}*/

char* send_request(char *req_response_buf, int req_type, char *device_imei, int device_imei_size, int temp_int, int hum_int, int air_q_int, char *battery_charge) {

    
    
    // Calculate how many numbers int contains
    int temp_n_digits = log10(abs(temp_int)) + 2; // Also \0
    int hum_n_digits = log10(abs(hum_int)) + 2;

    printk("Hum digits count : %d \n", hum_n_digits -1 );

    // If int was negative, add one place to negative-mark
    if (temp_int < 0) temp_n_digits++; 
    if (hum_int < 0) hum_n_digits++;

    // Arrays for values like temp, hum, batt
    char temperature[temp_n_digits];
    char humidity[hum_n_digits + 1]; // +1 for slash before value
    
    // Ints to char arrays
    sprintf(temperature, "%d\0", temp_int); // Note slashes before values!
    sprintf(humidity, "/%d\0", hum_int); 

    
    
    // The final payload will be saved here
    char final_send_buf[150];
        
    // Get url
    char get_url[100] = ""; // orig 50
    
    // Requset (get_url) lenght
    int req_size = 0;

    switch (req_type) {
        case 0:
            
            //SENSOR_DATA
            printk("Asked to create payload for sensor data... \n");

            // Static pieces from request
            char prefix[] = "/api/v1/";
            char cenfix[] = "/send/sensor/";

            // Fake humidity, air_uality and battery charge
            char suffix[] = "/-1/";

            // Convert temperature (int) to the char array 
            
            sprintf(temperature, "%d", temp_int);

            printk("viela ok \n");

            // Make paylaod from char arrays
            strcat(get_url, prefix);
            strcat(get_url, device_imei);
            strcat(get_url, cenfix);
            strcat(get_url, temperature);
            strcat(get_url, humidity);
            strcat(get_url, suffix); // (air_q)
            strcat(get_url, battery_charge);

            // Calculate get req size
            //printk("prefix size %d \n", sizeof(prefix));
            //printk("device_imei  size %d \n", device_imei_size);
            //printk("cenfix size %d \n", sizeof(cenfix));
            //printk("temp size %d \n", sizeof(temperature));
            printk("battery_charge size %d \n", sizeof(battery_charge));
            
            req_size = sizeof(prefix) + device_imei_size + sizeof(cenfix) + sizeof(temperature) + sizeof(humidity) + sizeof(suffix) - 5 + sizeof(battery_charge); // -5 bc each sizeof is 1 too large

            //printk("temp char array sisalto %s \n", temperature);
            //printk("temp char array sisalto %d \n", temp_int);


            break;

        case 1:
            //REGISTRATION_DATA
            printk("Asked to create payload for registration data... \n");

            char rr_prefix[] = "/api/v1/";
            char rr_suffix[] = "/request/registration/";

            // Make paylaod from char arrays
            strcat(get_url, rr_prefix);
            strcat(get_url, device_imei);
            strcat(get_url, rr_suffix);

            req_size = sizeof(rr_prefix) + device_imei_size + sizeof(rr_suffix) - 2;

            break;

        case 2:
            //ALERT_DATA
            printk("Asked to create payload for alert data... \n");

            char ta_prefix[] = "/api/v1/";
            char ta_suffix[] = "/trigger/alert/accel";

            // Make paylaod from char arrays
            strcat(get_url, ta_prefix);
            strcat(get_url, device_imei);
            strcat(get_url, ta_suffix);

            req_size = sizeof(ta_prefix) + device_imei_size + sizeof(ta_suffix) - 2;

            break;

        case 3:
            //change system_status
            printk("Asked to create payload system status data... \n");

            char ss_prefix[] = "/api/v1/";
            char ss_true[] = "/systemStatus/true";
            char ss_false[] = "/systemStatus/false";

            // Make paylaod from char arrays
            strcat(get_url, ss_prefix);
            strcat(get_url, device_imei);

            if (get_system_armed())
            {
                strcat(get_url, ss_false);
                req_size = sizeof(ss_prefix) + device_imei_size + sizeof(ss_false) - 2;
            } else {
                strcat(get_url, ss_true);
                req_size = sizeof(ss_prefix) + device_imei_size + sizeof(ss_true) - 2;
            }
            
            

            break;



        default:
            printk("User didn't specify which data will be sent to the server \n");
            return;          

    }

    
    printk("final_send_buffer:  '%s'\n", final_send_buf);
    printk("get_url:            '%s'\n", get_url);
    printk("get_url:n pituus:   '%d'\n", req_size);
    
    
    create_payload(final_send_buf, get_url, req_size);

    printk("_______________________\n'%s'", final_send_buf);
    printk("_______________________\n\n");
    
    //return;
    //goto clean_up;



    
  
	int err;
	int fd;
	char *p;
	int bytes;
	size_t off;
	struct addrinfo *res;
	struct addrinfo hints = {
		.ai_family = AF_INET,
		.ai_socktype = SOCK_STREAM,
	};

	printk("HTTPS client sample started\n\r");

	/* Initialize AT comms in order to provision the certificate */
	err = at_comms_init();
	if (err) {
		//return;
	}

    err = at_cmd_write("AT%XMAGPIO=1,1,1,7,1,746,803,2,698,748,2,1710,2200,3,824,894,4,880,960,5,791,849,7,1574,1577", NULL, 0, NULL);
    if (err) {
        printk("Failed to set MAGPIO, err %d\n", err);
        return err;
    }

	/* Provision certificates before connecting to the LTE network */
	err = cert_provision();
	if (err) {
		printk("CERT PROVISION FAILED");
		//return;
	}

	printk("Waiting for network.. ");
	err = lte_lc_init_and_connect();
	if (err) {
		printk("Failed to connect to the LTE network, err %d\n", err);
		//return;
	}
	printk("OK\n");

	err = getaddrinfo("watchdog.rantakangas.com", NULL, &hints, &res);
	if (err) {
		printk("getaddrinfo() failed, err %d\n", errno);
		//return;
	}

	((struct sockaddr_in *)res->ai_addr)->sin_port = htons(HTTPS_PORT);

	fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TLS_1_2);
	if (fd == -1) {
		printk("Failed to open socket!\n");
		goto clean_up;
	}

	/* Setup TLS socket options */
	err = tls_setup(fd);
	if (err) {
		goto clean_up;
	}


	printk("Connecting to %s\n", "WATCHDOG.RANTAKANGAS.COM");
	
	err = connect(fd, res->ai_addr, sizeof(struct sockaddr_in));
	if (err) {
		printk("connect() failed, err: %d\n", errno);
		goto clean_up;
	}

	off = 0;
	do {
		//bytes = send(fd, &send_buf[off], HTTP_HEAD_LEN - off, 0);
        bytes = send(fd, &final_send_buf[off], HTTP_HEAD_LEN - off, 0);
		if (bytes < 0) {
			printk("send() failed, err %d\n", errno);
			goto clean_up;
		}
		off += bytes;
	} while (off < HTTP_HEAD_LEN);

	printk("Sent %d bytes\n", off);

	off = 0;
	do {
//		bytes = recv(fd, &recv_buf[off], RECV_BUF_SIZE - off, 0);
        bytes = recv(fd, &req_response_buf[off], RECV_BUF_SIZE - off, 0);

		if (bytes < 0) {
			printk("recv() failed, err %d\n", errno);
			goto clean_up;
		}
		off += bytes;
	} while (bytes != 0 /* peer closed connection */);

	printk("Received %d bytes\n", off);

	/* Print HTTP response */
	/*
    p = strstr(recv_buf, "\r\n");
	if (p) {
		off = p - recv_buf;
		recv_buf[off + 1] = '\0';
		printk("\n>\t %s\n\n", recv_buf);
	}*/



    printk("\n>\t %s\n\n", req_response_buf);


	printk("Finished, closing socket.\n");


clean_up:
	freeaddrinfo(res);
	(void)close(fd);

    return req_response_buf;

    /*

    printk("gethttpcontenttiin on menossa payload: '%s' \n", recv_buf);
    char recv_buf_content[RECV_BUF_SIZE];
    


    get_http_content(recv_buf, sizeof(recv_buf), recv_buf_content);

    // settings check success that checks if payload was received correctly on the server end
    //recv_buf = "{\"status\":\"Success\",\"wut\":\"Device\'s data saved to the Watchdog\'s database\"}";
    printk("kutsutaan check_status\n");
    printk("Sinne on menossa payloadina '%s' \n", recv_buf_content);
    printk("Sen pituus on '%d' \n", sizeof(recv_buf_content));

    return check_success(recv_buf_content);
    */
      
}
