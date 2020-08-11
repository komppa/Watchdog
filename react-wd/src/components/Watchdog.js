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
import {BigButton} from './GeneralButton';
import Announcement from './Announcement'
import {Device} from './Bottombar';
import { userState, getLoggedIn, setLoggedIn } from './UserState'
import { systemStatus, newDevice, changeSettings, logout, alertCheck } from '../DataHandler'
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

const logout_img = require('../images/logout_img.png');	// Images for header
const settings_img = require('../images/settings_img.png');
const plus_btn_img = require('../images/plus_img.png');	//For adding a new device
const ok_img = require('../images/ok_img.png');	// For alerts checking
const warn_img = require('../images/warn_img.png');

// Server env variables
var server_addr = srv_addr()
var api_path = api_addr()

var annonceShown = false
var deviceSelected = false	//@startup

var devices;
var currentDevice;


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

	const [selectedDevice, setSelectedDevice] = useState("null")
	const [lastSeen, setLastSeen] = useState("-")

	const [windowHeight, setWindowHeight] = useState(window.innerHeight)
	const [devs, setDevs] = useState([])
	const [alerts, setAlerts] = useState([])

	const [ci, setCi] = useState(null)
	const [notif, setNotif] = useState(null)
    
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


	const fetchData = () => {
		
		let command = 'listDevices'
		let url = server_addr + api_path + command;
		
		axios.get(url, {withCredentials: true})	
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

				if (srv_data.data.status !== "Failure") {
					setShowLoginPage(false)
					srvDataHandler(srv_data)
					setShowMainPage(true)
					return
				}

				if (srv_data.data == undefined || srv_data.data == null) {
					setShowLoginPage(true)
					showAnnonce("System failure", "You< don't have permission to fetch data from server. ")
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

		devices.map(device => {

			let device_last_seen = device.last_seen_timestamp
			let device_temperature, device_humidity, device_battery

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

			let new_device = {
				name: device.friendly_name === undefined ? device.imei : device.friendly_name,
				imei: device.imei,
                armed: device.armed === undefined ? false : device.armed,
                pending: device.pending === undefined ? false : device.pending,
				battery:device_battery,
				temperature: device_temperature,
				humidity: device_humidity,
				last_seen: device_last_seen,
			}

			all_devices.push(new_device)
			
		})

		setDevs(all_devices)

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

	const srvDataHandler = res => {

		// Set connection interval from DB's body to the useState
		setCi(res.data.connection_interval)

		// Set notification email from DB to notif useState
		setNotif(res.data.notification_email)

		// Get global connection interval and set it to variable and useState
		devices = res.data.devices

		// If selected device is null / undefined, selecting first device from list
		if (!deviceSelected) {
			try {
				setSelectedDevice(devices[0].imei)
				deviceSelected = true
			} catch {
				console.log("User doesn't have any devices")
			}
		}

		getAlerts(devices)
		getDevices(devices)
		
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
                                fourth_row={data.checked ? null : <a href="#" style={{color: "white"}}>click to check</a>}
                                img_src={data.checked ? ok_img : warn_img}
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