#include <zephyr.h>

char* get_server_address(void);

bool alert_pending(void);
void set_alert_pending(bool);
s64_t get_alert_interval(void);
void set_alert_interval(s64_t);
bool alert_interval_valid(void);

bool get_system_armed(void);
void toggle_system_armed(void);
void set_system_armed(bool);


int get_connection_interval(void);
void set_connection_interval(int);
int get_sensor_data_last_sent(void);
void set_sensor_data_last_sent(int);

bool parse_response(char*);

