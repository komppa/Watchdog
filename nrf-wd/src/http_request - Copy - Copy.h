/*
 * Copyright (c) 2020 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-BSD-5-Clause-Nordic
 */

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


int get_recv_buf_size(void);

int at_comms_init(void);

/* Provision certificate to modem */

/* Setup TLS options on a given socket */
int tls_setup(int fd);

void create_payload(char *final_send_buf, char *get_url, int get_url_size);

char* send_request(char *, int type, char *device_imei, int device_imei_size, int temp_int, int hum_int, int air_q_int, char *battery_charge);

void toArray(int number, char* numberArray);

