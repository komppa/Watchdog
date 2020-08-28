# Watchdog


**~ Keep your loved ones safe using Thingy:91**
 

## New Features!
- Find device's location from dashboard by pressing *find device*-button. View its location after that by pressing the map icon. 
- From settings user can ask device's location after alert has been triggered. Checkbox *location on alert*.


## Getting started
 

### Nrf-Watchdog
 

nRF-Watchdog is Thingy:91 implementation of Watchdog. To program your device with precompiled hex file, take a look at Nordic's instuctions on how to program nRF9160 for Thingy:91 over there:
[nRF9160 Programming instructions][pgmming_thingy91]
 

To compile Watchdog yourself, here are instructions to get Nordic SDK:
[nRF Connect SDK][skd_thingy91]
 

### Too lazy to setup your own server to use Watchdog?


No problemos. Test it here before trying your own server:
[watchdog.rantakangas.com][wd_r]


### React-Watchdog
 

Watchdog's dashboard is written with ReactJS. Go to the react-wd folder and download dependencies and node modules using command:
```
npm install
```

After that you'll have a new folder called 'node-modules' and dependencies that are required by the project. Now Watchdog's web portal can be launched by executing the command (in folder react-wd)

```
npm start
```

Make sure that you have changed the front-end server address to the correct address in react-wd/src/Config.js



### NodeJS-Watchdog


Go to the node-wd directory in order to run Watchdog's NodeJS. I recommend using [nodemon][nodemon] for that.
```
nodemon 
```


## Instructions for use


### Thingy:91


Before you can pair your device to your account you'll need to start it first to establish the connection between Thingy and the server. Thingy:91 has been started when it flashes a green led three times to indicate that it isn't in armed mode. 


Thingy:91 has an onboard button and with that the user can execute different types of functionalities:


| Button holding time | Action |
| ------ | ------ |
| 1 s | Thingy:91'll flash its LED to indicate its battery charge |
| 5 s | Device changes its system armed mode between armed and disarmed |
| 10 s | Device send registration request to the server |


## Dashboard


When entering the dashboard for the first time the user must use "create new account". On register page user can specify user's username and optional notification email address, where Watchdog's server can send emails when an alert is triggered. After pressing the register-button server will generate a password for the user. Save that password somewhere!

After logging in press "add new deivice" from middle-left side of the page. Type in the IMEI from Thingy:91's sticker and a name that you want to use for that specific device. After typing those two things - press apply. NOTE: device must send a registration request to start the pairing process with a 10s. button press.


**Have fun with it :)**

 


[//]: # ()
   [pgmming_thingy91]: <https://infocenter.nordicsemi.com/topic/ug_thingy91/UG/thingy91/firmware/pgmming_thingy91.html>
   [skd_thingy91]: <https://www.nordicsemi.com/Software-and-tools/Software/nRF-Connect-SDK>
   [nodemon]: <https://www.npmjs.com/package/nodemon>
   [wd_r]: <https://watchdog.rantakangas.com>