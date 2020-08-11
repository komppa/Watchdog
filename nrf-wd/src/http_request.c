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
#include "http_request.h"
#include "payloads.h"

#define HTTPS_PORT 443
#define ADDR_MAX_LENGHT 100
#define HTTP_HEAD_LEN (sizeof(final_send_buf) - 1)
#define HTTP_HDR_END "\r\n\r\n"
#define RECV_BUF_SIZE 2048
#define TLS_SEC_TAG 42

int fd;
struct addrinfo *res;
struct addrinfo hints = {
    .ai_family = AF_INET,
    .ai_socktype = SOCK_STREAM,
};

/* Certificate for `*.rantakangas.com` */
static const char cert[] = {
	#include "../cert/WD-Rantakangas"
};

BUILD_ASSERT(sizeof(cert) < KB(4), "Certificate too large");


int get_recv_buf_size(void) {
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
	}

	return 0;
}

/* Provision certificate to modem */
int cert_provision(void)
{
	int err;
	bool exists;
	u8_t unused;

	err = modem_key_mgmt_exists(TLS_SEC_TAG, MODEM_KEY_MGMT_CRED_TYPE_CA_CHAIN, &exists, &unused);
	if (err) {
		printk("Failed to check for certificates err %d\n", err);
		return err;
	}

	if (exists) {
		/* For the sake of simplicity we delete what is provisioned
		 * with our security tag and reprovision our certificate.
		 */
		err = modem_key_mgmt_delete(TLS_SEC_TAG, MODEM_KEY_MGMT_CRED_TYPE_CA_CHAIN);
		if (err) {
			printk("Failed to delete existing certificate, err %d\n", err);
		}
	}

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

	err = setsockopt(fd, SOL_TLS, TLS_SEC_TAG_LIST, tls_sec_tag, sizeof(tls_sec_tag));
	if (err) {
		printk("Failed to setup TLS sec tag, err %d\n", errno);
		return err;
	}

	return 0;
}

void get_server_ip(void) {

    char *p;
    char addr[ADDR_MAX_LENGHT];

    strcpy(addr, get_server_address());

    // Rip off srv address port number if there is 
    p = strstr(addr, ":");
    if (p) {
        *p = '\0';
    } 

	int err = getaddrinfo(addr, NULL, &hints, &res);
	if (err) {
		printk("getaddrinfo() failed, err %d. Trying to init http requests...\n", errno);
        init_http_request();
	}
    
    ((struct sockaddr_in *)res->ai_addr)->sin_port = htons(HTTPS_PORT);
}

int init_http_request() {

    int err;

    err = bsdlib_init();
	if (err) {
		printk("Failed to initialize bsdlib! Or bsdlib already initialized! Trying to continue\n");
	}

	err = at_comms_init();
	if (err) {
		return -1;
	}

    err = at_cmd_write("AT%XMAGPIO=1,1,1,7,1,746,803,2,698,748,2,1710,2200,3,824,894,4,880,960,5,791,849,7,1574,1577", NULL, 0, NULL);
    if (err) {
        printk("Failed to set MAGPIO, err %d\n", err);
        return -100;
    }

	/* Provision certificates before connecting to the LTE network */
	err = cert_provision();
	if (err) {
		printk("CERT PROVISION FAILED");
		return -1;
	}

	printk("Waiting for network..\n");

	err = lte_lc_init_and_connect();
	if (err) {
        if (err == -120) {
            printk("Device has established connection already to network. \n");
        } else {
            printk("Failed to connect to the LTE network, err %d\n", err);
            return -1;
        }
		
	}
	printk("Connected to the network!\n");
    get_server_ip();
    return 0;
}

void close_socket(void) {
	(void)close(fd);
}

// Send requst to the server
void send_request(char *req_response_buf, int req_type) {

    int err;
    int bytes;
    int req_size = 0;
    char final_send_buf[250] = "";
    char get_url[250] = "";


    /* Create endpoint address */
    switch (req_type) {
        case SENSOR_DATA:
        {
            // SENSOR DATA
            sensor_payload(get_url, req_size);   
            break;
        }
        case REGISTRATION_DATA:
        {
            //REGISTRATION_DATA
            registration_payload(get_url, req_size);
            break;
        }
        case ALERT_DATA:
        {
            //ALERT_DATA
            alert_payload(get_url, req_size);            
            break;
        }
        case ARM_DATA:
        {
            //CHANGE SYSTEM_STATUS
            status_payload(get_url, req_size);
            break;

        }

        default:
            printk("User didn't specify which data will be sent to the server \n");
            return;          

    }
    
    /* Create HTTP request and add previously created endpoint to it */
    create_payload(final_send_buf, get_url, req_size);

    // Open socket
	fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TLS_1_2);
	if (fd == -1) {
		printk("Failed to open socket!\n");
        close_socket();
	}

	// Setup TLS socket options
	err = tls_setup(fd);
	if (err) {
        close_socket();
	}

	printk("Connecting to %s\n", get_server_address());
	
	err = connect(fd, res->ai_addr, sizeof(struct sockaddr_in));
	if (err) {
		printk("connect() failed, err: %d\n", errno);
        close_socket();
	}

    printk("send\n");

    size_t off = 0;
	do {
        bytes = send(fd, &final_send_buf[off], HTTP_HEAD_LEN - off, 0);
		if (bytes < 0) {
			printk("send() failed, err %d\n", errno);
            close_socket();
		}
		off += bytes;
	} while (off < HTTP_HEAD_LEN);

    printk("receive\n");

	off = 0;
	do {
        bytes = recv(fd, &req_response_buf[off], RECV_BUF_SIZE - off, 0);

		if (bytes < 0) {
			printk("recv() failed, err %d\n", errno);
            close_socket();
		}
		off += bytes;
	} while (bytes != 0 /* peer closed connection */);

    // Parsing message from response
    char *p;
    p = strstr(req_response_buf, HTTP_HDR_END);
	if (p) {
        strcpy(req_response_buf, (p + sizeof(HTTP_HDR_END) - 1));
	}

	printk("Finished, closing socket.\n");
    close_socket();

}

