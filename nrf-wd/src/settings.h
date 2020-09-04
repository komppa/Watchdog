#include <zephyr.h>
#include <stdio.h>


char* get_server_address(void);

// Alerts
bool alert_pending(void);
void set_alert_pending(bool);

s64_t get_alert_interval(void);
void set_alert_interval(s64_t);

bool alert_interval_valid(void);

// System status
bool get_system_armed(void);
void toggle_system_armed(void);
void set_system_armed(bool);

// Connection interval
int get_connection_interval(void);
void set_connection_interval(int);

// Sensor data sent time
int get_sensor_data_last_sent(void);
void set_sensor_data_last_sent(int);

// JSON parsing
bool parse_response(char*);

// GPS 
void set_gps_searching(bool);
bool get_gps_searching(void); 
void set_location(double, double);
double get_latitude(void);
double get_longitude(void);
void set_location_on_alert(bool);
bool get_location_on_alert(void);

// Location flag
void set_send_gps_location(bool);
bool get_send_gps_location(void);

// Location send flag
void set_search_gps_location(bool);
bool get_search_gps_location(void);


// Http request going on
void set_http_request_executing(bool);
bool get_http_request_executing(void);

