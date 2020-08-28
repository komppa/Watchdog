var express = require('express');
var router = express.Router();
const assert = require('assert');
var dotenv = require('dotenv')
const User = require('./mdb');
const { response } = require('express');
const { ObjectId } = require('mongodb');
const { request } = require('http');
const nodemailer = require("nodemailer");
const { getUnpackedSettings } = require('http2');
const { stat } = require('fs');

dotenv.config({path: './sderc.env'});

let smtp_host = process.env.SMTP_HOST
let smtp_port = process.env.SMTP_PORT
let smtp_user = process.env.SMTP_USER
let smtp_password = process.env.SMTP_PASSWORD

dotenv.config({path: './sderc.env'});

// Time since epoch
const getTime = () => {
    let time = new Date()
    return Math.floor(time.getTime() / 1000)
}

/*
    Send e-mails to address 'recvEmail' and 
    tell that its from device 'triggeredDevice' 
    because reason 'reason'
*/
const mailer = async (recvEmail, triggeredDevice, reason) => {
    
    const transporter = nodemailer.createTransport({
        host: smtp_host,
        port: smtp_port,
        auth: {
            user: smtp_user,
            pass: smtp_password
        }
    });

    let info = await transporter.sendMail({
        from: '"Watchdog - alert" dallas.hermann@ethereal.email',
        to: recvEmail,
        subject: "WATCHDOG - Device " + triggeredDevice + " triggered alert ⚠️",
        text: "Alert triggered\nAlert has been triggered by the device " + triggeredDevice + " and the reason is " + reason,
        html: "<h3>Alert triggered</h3><p>Alert has been triggered from device " + triggeredDevice + " and reason is " + reason + "</p>",
    });
}

/* Get device owner notification email address */
const getNotificationEmail = async (device_imei) => {

    let notificationEmail

    await User.findOne( { "devices.imei": device_imei } )
        .then((response) => notificationEmail = response.notification_email)
        .catch((err) => console.log("ERR: getNotificationEmail: ", err))

    return notificationEmail
}


/* Get device's friendly name by IMEI */
const getFriendlyName = async (device_imei) => {

    let friendlyName

    await User.findOne(
        { "devices.imei": device_imei},
        { "devices.$[]": 1 }
    )
        .then((response) => friendlyName = response.devices[0].friendly_name)
        .catch((err) => console.log("ERR: @getFriendlyName: ", err))

    return friendlyName
}

/* Check if device exists on database */
const deviceExists = async (device_imei) => {

    var device_exists;

    await User.find(
        {"devices.imei": device_imei}
    )
        .then(q_output => {

            // Checks if there is or is not device to assigned reueried imei
            if (q_output.length === 0) {
                device_exists = false
            } else {
                device_exists = true
            }
            
        })

        return device_exists
}


const getLoa = async (device_imei) => {

    let locationOnAlert

    await User.findOne({"devices.imei": device_imei}, 'loa')
        .then(response => locationOnAlert = response.loa)

    return locationOnAlert
    
}


const setLoa = (device_imei, new_value) => {
    User.updateOne(
        { "devices.imei": device_imei }, 
        { $set: { loa: new_value } }
    ).exec()
}


const getSln = async (device_imei) => {

    let sendLocationNow

    await User.findOne({"devices.imei": device_imei}, 'devices.sln')
        .then(response => sendLocationNow = response.devices[0].loa)

    return sendLocationNow
    
}



const setSln = (device_imei, new_value) => {
    
    User.updateOne(
        {
            "devices.imei": device_imei,
        }, 
        {
            $set: {
                "devices.$.sln": new_value
            }
        }
    )
        .exec()

}

/* Get device's settings like arming status and connection interval */
const getSettings = async (device_imei) => {

    var device_armed
    var device_ci
    var device_loa
    var device_sln

    let settings

    await User.find(
        {"devices.imei": device_imei},
        {
            "devices.$[]": 1,
            "loa": 1 
        }
    )
        .then(result => {

            

            device_armed = result[0].devices[0].armed
            // Checks if device is so new that it doesn't have arming status or CI
            if (device_armed !== true && device_armed !== false) {
                // Our lovely database has no clue whether the device is in armed or disarmed state
                device_armed = false // default value is disarmed if unknown
            }

            // Checking if device belong to some user and that way connection interval is known
            device_ci = result[0].connection_interval
            if (device_ci === undefined) {
                device_ci = 15 // default value if unknown
            }

            device_loa = result[0].loa
            if (device_loa !== true && device_loa !== false) {
                device_loa = false
            }

            device_sln = result[0].devices[0].sln
            if (device_sln !== true && device_sln !== false) {
                device_sln = false
            }
            
            /*
                Because Thingy can obtain request to send its location
                if sln (send location now) was true, we can set its 
                value to false that it woudn't send it again and again
            */
            setSln(device_imei, false)

            // Make JSON for settings
            settings = {
                status: "Success",
                armed: device_armed,
                ci: device_ci,
                loa: device_loa,
                sln: device_sln
            }

        })
        .catch(() => {
            
            // Make JSON for settings
            settings = {
                status: "Success",
                armed: false,
                ci: 15,
                loa: false,
                sln: false
            }   
        })

        return settings
}

/* Update device's last seen timestamp by IMEI */
const updateLastSeen = (device_imei) => {
    
    if (device_imei !== undefined)
    {
        User.updateOne(
            { "devices.imei": device_imei }, 
            {
                $set: {
                    "devices.$.last_seen_timestamp": getTime()
                } 
            },
        )
            .exec()
    }
}

/* 
    Update device's pending flag by IMEI.
    Pending flag is used by portal to inform 
    user if new command is in a queue or is it 
    already on device. 
*/
const updatePendingFlag = (device_imei, new_flag) => {

    User.updateOne(
        {"devices.imei": device_imei},
        { 
            $set: {
                "devices.$.pending": new_flag
            }
        },
    )
    .exec()
}


// Thingy sensor data endpoint
router.get('/:imei/send/sensor/:temp/:hum/:air_q/:volt', (req, res) => {

    const device_imei = req.params.imei
    const temperature = req.params.temp
    const humidity = req.params.hum
    const air_quality = req.params.air_q
    const voltage = req.params.volt

    if (
        device_imei === undefined ||
        temperature === undefined ||
        humidity === undefined ||
        air_quality === undefined ||
        voltage === undefined
    )
    {
        res.json({
            status: "Failure",
            reason: "Some params missing"
        })

        return;

    } else {

        deviceExists(device_imei)
            .then((device_exists) => {

                var new_env_data = {
                    env_timestamp: getTime(),
                    temperature: temperature,
                    humidity: humidity,
                    air_quality: -1,
                    battery: voltage,
                };    


                if (device_exists) {
                    // Device exists
                    User.updateOne(
                        { "devices.imei": device_imei }, 
                        {
                            $push: {
                                "devices.$.environment": new_env_data
                            } 
                        },
                    ).exec()

                } else {
                    // There is no device @DB like this
                    const new_device_entry = new User({
                        // Doesn't include any user specified information, only device
                        devices: [
                            {
                                imei: device_imei,
                                last_seen_timestamp: getTime(),
                                environment: new_env_data
                            },
                        ],
                    })
    
                    new_device_entry.save().then(
                        (savedUser) => {
                            console.log("New device's data saved to the DB")
                        }
                    )  
                } 
                
                // Lastly, update device seen timestamp
                updateLastSeen(device_imei)
                updatePendingFlag(device_imei, false)

                // Get current settings from DB and return them
                getSettings(device_imei)
                    .then(settings => {
                        console.log(settings)
                        res.json(settings)
                    })
            })
    }
})


// Put location to device's location array
const locationToLocations = (device_imei, latitude, longitude) => {

    var new_location_data = {
        location_timestamp: getTime(),
        latitude: latitude,
        longitude: longitude 
    };    

    User.updateOne(
        { "devices.imei": device_imei }, 
        {
            $push: {
                "devices.$.location": new_location_data
            } 
        },
    ).exec()

}

// Put location to device's alerts
const locationToAlert = (device_imei, alert_id, latitude, longitude) => {

    User.updateOne(
        {"devices.imei": device_imei}, 
        {
            $set: {
                "devices.$[].alert.$[a].location": { latitude, longitude }
            }
        }, 
        {
            arrayFilters: [{'a._id': ObjectId(alert_id)}]
        }
    )
        .exec()
        
}

// Thingy location endpoint
router.get('/:imei/send/location/:latitude/:longitude', (req, res) => {

    const device_imei = req.params.imei
    const latitude = req.params.latitude
    const longitude = req.params.longitude

    if (
        device_imei === undefined ||
        latitude === undefined ||
        longitude === undefined
    )
    {
        getSettings(device_imei)
            .then((settings) => res.json(settings))
        return
    }

    // All params ok
    deviceExists(device_imei)
        .then((device_exists) => {
            if (device_exists) {
                User.findOne(
                    { "devices.imei": device_imei},
                    { "devices.$[]": 1 }
                )
                    .then(data  => {
                        alerts = data.devices[0].alert
                        most_recent_a = alerts[alerts.length - 1]

                        if (most_recent_a === undefined) {
                            locationToLocations(device_imei, latitude, longitude)

                        } else {
                            alert_id = most_recent_a._id
                            alert_timestamp = most_recent_a.alert_timestamp
                            
                            // Checking if location belongs to locations array or most recent alert
                            
                            if (most_recent_a.location.latitude !== undefined) {
                                // Alert has location
                                locationToLocations(device_imei, latitude, longitude)
                            } else {
                                // Alert doesn't have location
                                getLoa(device_imei)
                                    .then(loaActive => {
                                        if (loaActive) {
                                            console.log("LocationOnAlert is true - PUT location to alert!")
                                            locationToAlert(device_imei, alert_id, latitude, longitude)
                                        } else {
                                            console.log("LOA is false - it doesn't want location")
                                            locationToLocations(device_imei, latitude, longitude)
                                        }
                                    })
                            }
                        }
                    })
            }

        // Return device's settings to the device in any case
        getSettings(device_imei)
            .then((settings) => res.json(settings))
        })
		
})


// Thingy alert endpoint
router.get('/:imei/trigger/alert/:reason', (req, res) => {

    const device_imei = req.params.imei
    const reason = req.params.reason

    if (device_imei === undefined || reason === undefined)
    {
        res.json({
            status: "Failure",
            reason: "Some params missing"
        })

        return;

    } else {

        deviceExists(device_imei)
            .then((device_exists) => {

                var new_alert_data = {
                    alert_timestamp: getTime(),
                    reason: reason,
                    checked: false,
                };    

                if (device_exists) {
                    // Device exists
                    User.updateOne(
                        { "devices.imei": device_imei }, 
                        {
                            $push: {
                                "devices.$.alert": new_alert_data
                            } 
                        },
                    ).exec()

                } else {
                    // There is no device with this IMEI
                    const new_device_entry = new User({
                        // Doesn't include any user specified information    
                        devices: [
                            {
                                imei: device_imei,
                                alert: new_alert_data,
                            },
                        ],
                    })
    
                    new_device_entry.save().then(
                        (savedUser) => {
                            getSettings(device_imei)
                                .then((settings) => res.json(settings))
                        }
                    )  
                }
                
                updateLastSeen(device_imei)
                updatePendingFlag(device_imei, false)

                // Get current settings from DB and return them
                getSettings(device_imei)
                    .then(settings => {
                        res.json(settings)
                    })

                // Send email notification if user has decided notification address
                getNotificationEmail(device_imei)
                    .then(address => {
                        getFriendlyName(device_imei)
                            .then(friendlyName => {

                                if (address.length !== 0) {
                                    // User has specified notification email address -> send 
                                    mailer(address, friendlyName, "movement") // Send email
                                        .catch(console.error)
                                }
                            })
                    })
            })
    }
})


// Thingy registration request endpoint
router.get('/:imei/request/registration', (req, res) => {

    const device_imei = req.params.imei

    if (device_imei === undefined)
    {
        res.json({
            status: "Failure",
            reason: "IMEI missing"
        })

        return;

    } else {

        deviceExists(device_imei)
            .then((device_exists) => {

                if (device_exists) {
                    // Device exists
                    User.updateOne(
                        { "devices.imei": device_imei }, 
                        {
                            $set: {
                                "devices.$.registration_timestamp": getTime()
                            } 
                        },
                    )
                        .exec()

                } else {
                    // Device doesn't exists
                    const new_device_entry = new User({
                        // Doesn't include any user specified information    
                        devices: [
                            {
                                imei: device_imei,
                                registration_timestamp: getTime(),
                            },
                        ],
                    })
    
                    new_device_entry.save().then(
                        (savedUser) => {
                            getSettings(device_imei)
                                .then((settings) => res.json(settings))
                        }
                    )  
                }  

                updateLastSeen(device_imei)
                updatePendingFlag(device_imei, false)

                // Get current settings from DB and return them
                getSettings(device_imei)
                    .then(settings => {
                        res.json(settings)
                    })

            })
    }
})

// Thingy system status endpoint
router.get('/:imei/systemStatus/:status', (req, res) => {

    const device_imei = req.params.imei
    const status = req.params.status

    if (device_imei === undefined || status === undefined)
    {
        res.json({
            status: "Failure",
            reason: "IMEI or new system status missing"
        })

        return;

    } else {

        deviceExists(device_imei)
            .then((device_exists) => {

                if (device_exists) {
                    // Device exists
                    User.updateOne(
                        { "devices.imei": device_imei }, 
                        {
                            $set: {
                                "devices.$.armed": status
                            } 
                        },
                    )
                        .exec()
                        .then(() => {
                            getSettings(device_imei)
                                .then((settings) => res.json(settings))
                        })

                } else {
                    // There is no device with this IMEI
                    const new_device_entry = new User({
                        // Doesn't include any user specified information    
                        devices: [
                            {
                                imei: device_imei,
                                armed: status,
                            },
                        ],
                    })

                    new_device_entry.save().then(
                        (savedUser) => {
                            getSettings(device_imei)
                                .then((settings) => res.json(settings))
                        }
                    )  
                }
                updateLastSeen(device_imei)
                updatePendingFlag(device_imei, false)
            })
    }
})

module.exports = router;