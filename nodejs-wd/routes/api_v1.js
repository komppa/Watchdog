var express = require('express');
var router = express.Router();
const assert = require('assert');
var dotenv = require('dotenv')
const User = require('./mdb');
const { response } = require('express');
const { ObjectId } = require('mongodb');
const { request } = require('http');
const nodemailer = require("nodemailer")

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
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'dallas.hermann@ethereal.email',
            pass: 'HP8uFX1ezuBKD6BnG3'
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

/* Get device's settings like arming status and connection interval */
const getSettings = async (device_imei) => {

    var device_armed
    var device_ci

    await User.find(
        {"devices.imei": device_imei}
    )
        .then(result => {
            result[0].devices.map((device) => {
                if (device.imei.toString() === device_imei) {

                    // Checks if device is so new that it doesn't have arming status or CI
                    if (device.armed == undefined || device.armed == null) {
                        // Our lovely database has no clue whether the device is in armed or disarmed state
                        device_armed = false // default value is disarmed if unknown
                    } else {
                        device_armed = device.armed
                    }
                }
            })

            // Checking if device belong to some user and that way connection interval is known
            let ci_cand = result[0].connection_interval
            if (ci_cand !== undefined) {
                device_ci = ci_cand
            } else {
                device_ci = 60 // default value if unknown
            }

            // If there weren't device like this, return defualts to avoid crashes :)
            device_armed = device_armed === undefined ? false : device_armed

        });

        // Make JSON for settings
        let settings = {
            status: "Success",
            armed: device_armed,
            ci: device_ci,
        }

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
                            getSettings(device_imei)
                                .then((settings) => res.json(settings))

                        }
                    )  
                } 
                
                // Lastly, update device seen timestamp
                updateLastSeen(device_imei)
                updatePendingFlag(device_imei, false)

                // Get current settings from DB and return them
                getSettings(device_imei)
                    .then(settings => res.json(settings))
            })
    }
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