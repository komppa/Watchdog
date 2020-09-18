import React, { useState, useCallback, useEffect } from 'react'
import { motion } from "framer-motion";
import axios from 'axios';
import Topbar from './grids/Topbar'
import Header from './Header'
import Bottombar from './grids/Bottombar'
import Middlebar from './grids/Middlebar'
import Devices from './Devices'
import {Alerts, AlertRow} from './Alerts'
import {Clock, getClock, getDay} from './Clock'
import {SystemStatus, ChangeStatus} from './System';
import Environment from './Environment'
import Location from './Location'
import {BigButton} from './GeneralButton';
import Announcement from './Announcement'
import {Device} from './Bottombar';
import { userState, getLoggedIn, setLoggedIn } from './UserState'
import { systemStatus, newDevice, changeSettings, logout, alertCheck, requestLocation } from '../DataHandler'
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link,
    useHistory,
    Redirect
} from "react-router-dom";
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel';
import AddDevice from './AddDevice';
import Settings from './Settings';
import { srv_addr, api_addr } from '../Config'
import Wdmap from './Wdmap';

const logout_img = require('../images/logout_img.png');	// Images for header
const settings_img = require('../images/settings_img.png');
const plus_btn_img = require('../images/plus_img.png');	//For adding a new device
const ok_img = require('../images/ok_img.png');	// For alerts checking
const warn_img = require('../images/warn_img.png');

// Images for GPS
const gps_found = require('../images/gps_found.png');
const gps_not_fixed = require('../images/gps_not_fixed.png');
const gps_disabled = require('../images/gps_disabled.png');

// Server env variables
var server_addr = srv_addr()
var api_path = api_addr()

var annonceShown = false
var deviceSelected = false	//@startup

var devices;
var currentDevice;
var mostRecentLocation = [0,1,1,"dev"]


var announcementContent = {
	title: "This is announcement's title",
	text: "Yep, that's right."
}

var lastAnnouncement = ""

const ProtectedWatchdog = ({ component: Component, ...rest }) => {
    return (
        <Route
            {...rest} 
            render={props => {
                
                if (getLoggedIn()) {
                    return <Watchdog {...props} />
                } else {
                    return <Redirect to='/login' />
                }
            }
        }>
        </Route>
    )
}

const Watchdog = (props) => {

	const [showMainPage, setShowMainPage] = useState(false)
	const [showLoginPage, setShowLoginPage] = useState(true)
	const [showSettings, setShowSettings] = useState(false)
	const [showAddDevice, setShowAddDevice] = useState(false)
	const [showAnnouncement, setShowAnnouncement] = useState(false)	
	const [isLoggedIn, setIsLoggedIn] = useState(true)
	const [showMap, setShowMap] = useState(false)

	const [selectedDevice, setSelectedDevice] = useState("null")
	const [lastSeen, setLastSeen] = useState("-")

	const [windowHeight, setWindowHeight] = useState(window.innerHeight)
	const [devs, setDevs] = useState([])
	const [alerts, setAlerts] = useState([])

	const [ci, setCi] = useState(null)
	const [loa, setLoa] = useState(false)
	const [notif, setNotif] = useState(null)

	//const [mostRecentLocation, setMostRecentLocation] = useState([])
	const [mapData, setMapData] = useState([0, 0, 0, 0])
	const [newLocationArrived, setNewLocationArrived] = useState(false)
    
    {/* Fetch data from the server if user has logged in */}
	useEffect(() => {
		fetchDataCaller()
	}, [])

	{/* Keep BottomBar's height updated */}
	useEffect(() => {
        resizeWindow();
        window.addEventListener('resize', resizeWindow);
        return () => {
            window.removeEventListener('resize', resizeWindow);
        }
    }, []);
    
    const resizeWindow = () => {
        setWindowHeight(window.innerHeight);
    };

    const getFriendlynameByImei = (imei) => {

		let name = "Undefined"

		devs.map(device => {
			if (device.imei == imei) {
				if (device.name === undefined) {
					name = device.imei
				} else {
					name = device.name
				}
			}
		})
	
		return name
    }
    
    
	const showAnnonce = (a_title, a_text) => {
		
		if(annonceShown || a_title === lastAnnouncement) {
			return
		} 

		annonceShown = true
		announcementContent = {
			title: a_title, 
			text: a_text,
		}
		lastAnnouncement = announcementContent.title
		setTimeout(() => {
			setShowAnnouncement(true)
			setTimeout(() => {
				setShowAnnouncement(false)
				annonceShown = false
				
			}, 4000)
		}, 500)
	
		
    }
    
    const f_logout = () => {
        logout().then((res) => {
            if (res) {
                showAnnonce(res.title, res.text)
                setLoggedIn(false)
            } else {
                showAnnonce(res.title, res.text)
            }
        })
    }

    const changeAlertCheck = (alert_id, alert_imei, alert_checked) => {
        
        alertCheck(alert_id, alert_imei, alert_checked)
            .then((res) => !res && showAnnonce(res.title, res.text))

		setAlerts(
			alerts.map(alert => 
				alert._id == alert_id
				? {...alert, checked: !alert_checked}
				: alert
			)
		)
	}

	const changeSettingsConfiguration = (new_ci, new_notif_email) => {
        changeSettings(new_ci, new_notif_email)
            .then((res) => {
                if (res.status) {
					showAnnonce(res.title, res.text)
					setCi(new_ci)
					setNotif(new_notif_email)
                    setShowSettings(false)
                } else {
                    showAnnonce(res.title, res.text)
                }
            })
	}

    const changeSystemStatus = (status) => {

		let new_pending

		devs.map(device => {
			if (device.imei === selectedDevice) {
				// If status is new status
				if (device.armed != status) {
					if (device.pending) {
						new_pending = false
					} else {
						new_pending = true
					}
				} else {
					new_pending = device.pending
				}
			}
		})

		setDevs(
			devs.map(device => 
				device.imei === selectedDevice 
				? {...device, armed : status, pending: new_pending}
				: device
			)
		)

        systemStatus(status, selectedDevice)
            .then((req_res) => showAnnonce(req_res.title, req_res.text))
    }
    
    const addNewDevice = (imei, name) => {

        newDevice(imei, name)
            .then((res) => {
                if (res.status) {
                    showAnnonce(res.title, res.text)
                    setShowAddDevice(false)
                } else {
                    showAnnonce(res.title, res.text)
                }
                fetchData()
            })
	}
	
	const sendLocationRequest = (device_imei) => {

				
		
		requestLocation(device_imei)
			.then((res) => {
				if (res.status) {
					showAnnonce(res.title, res.text)
				} else {
					showAnnonce(res.title, res.text)
				}
			})
		
	}


	const fetchData = () => {
		
		axios.get(server_addr + api_path + 'listDevices', {withCredentials: true})	
			.then((srv_data) => {

				if (srv_data.data.status === "Not logged in" || srv_data.data.status === "Failure") {
					return 
				} else {
					
				}
				if (srv_data.data.status === "No devices") {
					setShowLoginPage(false)
					setShowMainPage(true)
					showAnnonce("Welcome!", "It seems like you don't have devices... Yet :)")
					return
				}

				if (srv_data.data.status !== "Failure") {	// If not failure - success!
					setShowLoginPage(false)
					srvDataHandler(srv_data)
					setShowMainPage(true)
					return
				}

				if (srv_data.data == undefined || srv_data.data == null) {
					setShowLoginPage(true)
					showAnnonce("System failure", "You don't have permission to fetch data from server. ")
					return
				}				
			})
			.catch((error) => showAnnonce("System failure", "Couldn't fetch data from server (" + server_addr + "). " + error))	
			
	}

	const fetchDataCaller = () => {
		if (getLoggedIn()) fetchData()
		setTimeout(() => {
			fetchDataCaller()
		}, 4000)
	}

	const getDevices = (devices) => {
		
		let all_devices = []
		var newest_location_timestamp = 0

		devices.map(device => {

			let device_last_seen = device.last_seen_timestamp
			let device_temperature, device_humidity, device_battery, device_location

			// Get most recent temperature from environmental data
			let env_max_timestamp = 0
			device.environment.map(env_data => {
				if (env_data.env_timestamp > env_max_timestamp) {
					env_max_timestamp = env_data.env_timestamp
					device_temperature = env_data.temperature
					device_humidity = env_data.humidity
					device_battery = env_data.battery
				}
			})
			

			// Get most recent location from location
			device_location = device.location[device.location.length - 1]

			if (device_location === undefined) {
				device_location = [0, 0]
			} else {
				console.log("---> ", device_location)
				// Save the most recent location's timestamp that system can know if new location has been arrived
				if (device_location.location_timestamp > newest_location_timestamp) {
					newest_location_timestamp = device_location.location_timestamp

					newest_location_timestamp = device_location.location_timestamp

					mostRecentLocation[1] = device_location.latitude
					mostRecentLocation[2] = device_location.longitude
					mostRecentLocation[3] = device.friendly_name === undefined ? device.imei : device.friendly_name
				}
			}



			let new_device = {
				name: device.friendly_name === undefined ? device.imei : device.friendly_name,
				imei: device.imei,
                armed: device.armed === undefined ? false : device.armed,
                pending: device.pending === undefined ? false : device.pending,
				battery:device_battery,
				temperature: device_temperature,
				humidity: device_humidity,
				last_seen: device_last_seen,
				last_location: [
					device_location.latitude !== undefined ? device_location.latitude : 0 ,
					device_location.longitude !== undefined ? device_location.longitude : 0,
					device_location.location_timestamp !== undefined ? device_location.location_timestamp : "unknown" ]
			}

			all_devices.push(new_device)
			
		})

		setDevs(all_devices)

		if (mostRecentLocation[0] !== newest_location_timestamp) {
			if (deviceSelected) {
				console.log(mostRecentLocation[1])
				if (mostRecentLocation[1] == 0 && mostRecentLocation[1] == 0) {
					showAnnonce("GPS Failure", "The device could not get a GPS fix")
					mostRecentLocation[1] = 0
					mostRecentLocation[2] = 0
				} else {
					showAnnonce("Location arrived!", "Your device " + mostRecentLocation[3] + " updated its location! Press map icon to show map.")
					setNewLocationArrived(true)
					lastAnnouncement = "" // Resets last annonce that same annonce can be shown multiply times in a row
				}
				
			} else {
			}

			mostRecentLocation[0] = newest_location_timestamp
			mostRecentLocation[0] = newest_location_timestamp
			mostRecentLocation[0] = newest_location_timestamp

		}
	}


	const getAlerts = (devices) => {
		
		let new_alerts = []
		
		devices.map((device) => {
			device.alert.map((alert) => {
			
				alert.id = alert._id
				alert.name = device.friendly_name === undefined 
								? device.imei
								: device.friendly_name 
				alert.imei = device.imei

				// If alert doesn't have location object in it - gps_disabled
				if (alert.location === undefined) {
					alert.location_status = gps_disabled
				} else {
					// If alert location lat and lon is 0 - GPS not fix
					if (alert.location.latitude === 0 && alert.location.longitude === 0) {
						alert.location_status = gps_not_fixed
					} else {
						console.log("--------------", alert)
						alert.location_status = gps_found
						alert.latitude = alert.location.latitude
						alert.longitude = alert.location.longitude
						// Location ok
					}
				}

				new_alerts.push(alert)
			})
		})

		new_alerts.sort((a, b) => b.alert_timestamp - a.alert_timestamp)
		new_alerts.map(alert => {
			let t = new Date((alert.alert_timestamp * 1000))
			let clock = getClock(t)
			let date = getDay(t)
			alert.alert_timestamp = date + " " + clock
		})

		setAlerts(new_alerts)

	}


	const getTimeForSelDev = () => {
		let time
		devs.map((device) => {
			console.log("@getTimeForSelDev: ", device)
			if (device.imei === selectedDevice) {
				time = device.last_location[2]		
			}
		})

		let t = new Date((time * 1000))
		let clock = getClock(t)
		let date = getDay(t)
		return date + " " + clock
	}

	const getLocForSelDev = (isLongitude) => {
		let loc
		devs.map((device) => {
			console.log("@getLocForSelDev: ", device)
			if (device.imei === selectedDevice) {
				if (!isLongitude) {
					loc = device.last_location[0]		
				} else {
					loc = device.last_location[1]		
				}
			}
		})
		return loc
	}
	
	

	const srvDataHandler = res => {

		// Set connection interval from DB's body to the useState
		setCi(res.data.connection_interval)
	
		setLoa(res.data.loa)

		// Set notification email from DB to notif useState
		setNotif(res.data.notification_email)

		// Get global connection interval and set it to variable and useState
		devices = res.data.devices



		getAlerts(devices)
		getDevices(devices)
		//getMostRecentLocation(devices)

		// If selected device is null / undefined, selecting first device from list
		if (!deviceSelected) {
			try {
				setSelectedDevice(devices[0].imei)
				deviceSelected = true
			} catch {
				console.log("User doesn't have any devices")
			}
		}

		
		
	}



    return (
        <>
            {/* Settings */}
			{showSettings ?
				<Settings
					onclick_apply={(c_interval, n_email) => changeSettingsConfiguration(c_interval, n_email)}
					onclick_cross={() => setShowSettings(false)}
					connection_interval={ci}
					notification_email={notif}
					location_on_alert={loa}
				/>
			: null }

			{/* Add device */}
			{showAddDevice ?
				<AddDevice
					onclick_apply={(imei, name) => addNewDevice(imei, name)}
					onclick_cross={() => setShowAddDevice(false)}
				/>
			: null }

            {/* Announcement box */}
			{showAnnouncement ? 
				<Announcement content={announcementContent} /> 
			: null}
            
			{/* Location map box */}
			{showMap ? 
				<Wdmap
					deviceName={[mapData[0]]}
					position={[mapData[1], mapData[2]]}
					location_timestamp={mapData[3]}
					onclick_cross={() => setShowMap(false) }
				/>
			: null}

            {/* TopBar */}
            <Topbar>

                <Header /> {/* Header - WD Logo */}

                <BigButton
                    text="LOG OUT"
                    image={logout_img}
                    call={() => {
                        f_logout()
                        props.history.push('/login')
                    }}
                />

                <BigButton
                    text="SETTINGS"
                    image={settings_img}
                    call={() => setShowSettings(true)}
                />

            </Topbar>

            {/* MiddleBar */}
            <Middlebar>

                <Clock />

                <SystemStatus
                    selectedDevice={selectedDevice}
                    devices={devs}
                />

                <ChangeStatus 
                    onclick_arm={() => changeSystemStatus(true)}
                    onclick_disarm={() => changeSystemStatus(false)}
                />

				<Location
					onclick_find_device={() => sendLocationRequest(selectedDevice)}
					new_location={newLocationArrived}
					onclick_map={() => {
						setMapData([getFriendlynameByImei(selectedDevice), getLocForSelDev(false), getLocForSelDev(true), getTimeForSelDev()])
						setShowMap(true)
						setNewLocationArrived(false)
					}}
				/>

                <Environment 
                    selectedDevice={selectedDevice}
                    devices={devs}
                />
                
            </Middlebar>

            <Bottombar windowHeight={windowHeight}>
                <Devices onclick_addDevice={() => setShowAddDevice(true)}>
                    {
                        devs.map(data =>
                            <Device
                                key={data.imei}
                                id={data.imei}
                                name={data.name}
                                selected={ data.imei === selectedDevice ? true : false }
                                battery={data.battery}
                                armed={data.armed}
                                pending={data.pending}
                                onclick_device={() => setSelectedDevice(data.imei)}
                            /> 
                        )
                    }
                </Devices>

                <Alerts>
                    {
                        alerts.map(data => 
                            <AlertRow
                                key={data._id}
                                id={data._id}
                                first_row={data.alert_timestamp}
                                second_row={data.name}
								third_row={data.reason}
								location_img_src={data.location_status}
								allowMapFunc={data.location_status === gps_found ? true : false}
								onclick_locationBtn={() => {
									setMapData([data.name, data.latitude, data.longitude, data.alert_timestamp])
									setShowMap(true)
								}}
								fourth_row={data.location_status === gps_found ? "" : ""}
								fifth_row={data.checked ? null : <a href="#" style={{color: "white"}}>click to check</a>}
                                checked_img_src={data.checked ? ok_img : warn_img}
                                onclick_checkedBtn={() => changeAlertCheck(data._id, data.imei, data.checked)}
                            />
                        )
                    }
                </Alerts>
            </Bottombar>
        </>
    )
}

export {
    Watchdog,
    ProtectedWatchdog
}