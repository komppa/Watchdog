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
#include <zephyr.h>
#include "settings.h"


int get_recv_buf_size(void);

int at_comms_init(void);
int cert_provision(void);
int tls_setup(int fd);
void get_server_ip(void);
int init_http_request(void);
void close_socket(void);
void send_request(char *, int type);