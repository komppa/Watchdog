cmake_minimum_required(VERSION 3.8.2)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(watchdog)

target_sources(app PRIVATE src/main.c)
zephyr_library_sources(src/http_request.h)
zephyr_library_sources(src/http_request.c)

zephyr_library_sources(src/wsensor.h)
zephyr_library_sources(src/wsensor.c)

zephyr_library_sources(src/at_cmd.h)
zephyr_library_sources(src/at_cmd.c)

zephyr_library_sources(src/led.h)
zephyr_library_sources(src/led.c)

zephyr_library_sources(src/movement.h)
zephyr_library_sources(src/movement.c)

zephyr_library_sources(src/settings.h)
zephyr_library_sources(src/settings.c)

zephyr_library_sources(src/btn_handler.h)
zephyr_library_sources(src/btn_handler.c)


zephyr_library_sources(src/payloads.h)
zephyr_library_sources(src/payloads.c)

zephyr_library_sources(src/supl_support.h)
zephyr_library_sources(src/supl_support.c)


target_link_libraries(app PUBLIC libm.a)


