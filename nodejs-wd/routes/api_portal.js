var express = require('express');
var router = express.Router();
const assert = require('assert');
const User = require('./mdb');
const { response } = require('express');
const { ObjectId } = require('mongodb');
const { request } = require('http');

// Return time since epoch
const getTime = () => {
    let time = new Date()
    return Math.floor(time.getTime() / 1000)
}

/* Set or unset device's pending flag by IMEI */
const setPending = async (imei, status) => {
    await User.updateOne(
        {"devices.imei": imei},
        {
            $set: { 
                "devices.$.pending": status
            } 
        } 
    )
        .exec()
}

/* Get specific device's pending status */
const getPending = async (imei) => {

    let pendingStatus
    
    await User.findOne(
        { "devices.imei": imei },
        { "devices.$[]": 1 }
    )
        .then((result) => {
            if (result.devices[0] === undefined) {
                return -1
            }
            pendingStatus = result.devices[0].pending
        })
        .catch(err => {
            console.log("ERR: @getpending: ", err)
            return -2
        })

        return pendingStatus
}

/* Returns boolean of device's existence */
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

// Update friendly name to device
router.get('/updateFriendlyname/:imei/:friendly_name', (req, res) => {

    const device_imei = req.params.imei;
    const f_name = req.params.friendly_name;

    if (device_imei === undefined || f_name === undefined) res.end("IMEI OR F_NAME MISSING!");

    deviceExists(device_imei)
        .then(device_exists => {
            if (device_exists) 
            {
                User.updateOne(
                    {
                        "devices.imei": device_imei,
                    },
                    {
                        $set: {
                            "devices.$.friendly_name": f_name
                        }
                    }
                )
                    .exec()

            } else {
                const new_device_entry = new User({
                    // Doesn't include any user specified information    
                    devices: [
                        {
                            imei: device_imei,
                            friendly_name: f_name,
                            armed: false,
                            last_seen_timestamp: 15940278482,
                            connection_interval: 159,
                            registration_timestamp: getTime(),
                        },
                    ],
                })

                new_device_entry.save().then(
                    (savedUser) => {
                        res.json(savedUser)
                    }
                )                
            }
        })

        res.json({
            status: "Success", 
            reason: "Friendly name udpated successfully to " + f_name 
        })

})



// Add device to user
router.get('/addDevice/:imei/:friendly_name', (req, res) => {

    const user_token = req.cookies.token
    const device_imei = req.params.imei
    const f_name = req.params.friendly_name

    if (
        user_token === undefined ||
        device_imei === undefined ||
        f_name === undefined ||
        isNaN(device_imei) 
        )
    {
        res.json({
            status: "Failure",
            reason: "Meh, user's token and / or device's IMEI missing in numerical format"
        })
    
        return;
    } 

    deviceExists(device_imei)
        .then(device_exists => {

            if (device_exists)
            {

                // Device exists
                User.findOne(
                    {"devices.imei": device_imei},
                    { "devices.$[]": 1 }
                )
                    .then(result => {
                        
                        if (result.token === undefined) 
                        {

                            // Nobody owns the device
                            // Checks if registration timestamp is small enought to pair
                            // Checks also if someonw owns the device already                     


                            let rr_timestamp = 0

                            if (result.devices[0].registration_timestamp !== undefined) {
                                rr_timestamp = result.devices[0].registration_timestamp
                            }

                            if ((getTime() - rr_timestamp) > 200)
                            {
                                res.json({
                                    status: "Failure",
                                    reason: "Set your device to pairing mode first by pressing Thingy:91's button for 10s."
                                })

                                return;
                            }

                            var device_data = result.devices[0]
                            var device_document_id = result._id

                            User.updateOne({ token: user_token }, 
                                { $push: {devices: device_data} },
                            ).exec()

                            User.deleteOne({_id: ObjectId(device_document_id)})
                                .then(() => {
                                    User.updateOne(
                                        { "devices.imei": device_imei }, 
                                        {
                                            $set: {
                                                "devices.$.friendly_name": f_name
                                            } 
                                        })
                                            .exec()
                                            .then(() => res.json({
                                                status: "Success",
                                                reason: "Device added successfully to the user"
                                            }))
                                })
                            return
                          
                        } else {
                            // There is alredy owner to this device
                            res.json({
                                status: "UNKNOWN?",
                                reason: "There are already owner to this device with IMEI " + device_imei
                            })

                            return;
                        }
                    })

            } else {
                // There are no device with this imei
                res.json({
                    status: "Failure", 
                    reason: "There is no device with IMEI " + device_imei
                })

                return;
            }

        })
})

/* Change alert's status to checked or unchecked */
const changeChecked = async (alert_imei, alert_id, status) => {

    if (alert_imei === undefined || alert_id === undefined || status === undefined)
    {
        return -10
    } 

    // Check if new status will be true or false 
    if (status !== "true" && status !== "false")
    {
        return -11;
    } 
    
    let new_status = status == "true" ? true : false

    await User.updateOne({"devices.imei": alert_imei}, 
        {
            $set: {
                "devices.$[].alert.$[a].checked": new_status}
            }, 
            {
                arrayFilters: [{'a._id': ObjectId(alert_id)}]
            }
        )
            .exec()

    return 0
}

/* Change alert's status to checked or unchecked */
router.get('/check/:imei/:id/:status', (req, res) => {

    const alert_imei = req.params.imei;
    const alert_id = req.params.id;
    const status = req.params.status;

    changeChecked(alert_imei, alert_id, status)
        .then((err) => {
            if (err) 
            {
                err = isNaN(err) ? -100 : err
                res.json({
                    status: "Failure",
                    reason: "Didn't receive token, alert's ID and/or new status or perhaps status wasn't tru or false",
                    err_code: err
                })
            } else {
                res.json({
                    status: "Success",
                    reason: "Checked status changed to alert with corresponding AlertID"
                })
            }
        })
    

})

/* Get connection interval */
router.get('/getConnectionInterval', (req, res) => {

    const user_token = req.cookies.token
    
    if (user_token === undefined) {
        res.json({
            status: "Failure",
            reason: "Token is missing from request"
        })
        return
    }

    User.find(
        {
            token: user_token,
        }
    )

        .then((result) => {

            if (result[0] === undefined) {
                res.json({
                    status: "Failure", 
                    reason: "Invalid user token "
                })

                return
            }

            res.json({
                status: "Success",
                reason: "Connection interval query success",
                ci: result[0].connection_interval
            })
        })
        .catch((err) => res.json({
            status: "Failure", 
            reason: "Some massive f4i1ur3 on the serer-end :´( DB, are you ok?"
        }))

})


/* Change settings - conneciton interval and notification email */
router.get('/settings/:ci/:ne', (req, res) => {
    
    const user_token = req.cookies.token;
    let device_ci = req.params.ci
    let user_ne = req.params.ne

    if (user_token === undefined || device_ci === undefined || user_ne === undefined)
    {
        res.json({
            status: "Failure",
            reason: "Didn't reveice token, new CI time or notif addr"
        })
    
        return;
    } 

    if (isNaN(device_ci)) {
        res.json({
            status: "Failure",
            reason: "New connection inteval is not in numerical format"
        })
        
        return;
    }

    if (device_ci === -1) {
        device_ci = 20
    }

    if (user_ne === "-1") user_ne = ""

    if (device_ci > 86400) device_ci = 86400;
    if (device_ci < 10) device_ci = 10;

    User.updateOne(
        {
            token: user_token
        },
        {
            $set: {
                "connection_interval": device_ci,
                "notification_email": user_ne
            }
        }
    )
        .exec()

    res.json({
        status: "Success",
        reason: "System's connection interval changed successfully to " + device_ci
    })
})

/* Change system's status to armed or disarmed */
const changeSystemStatus = (new_status, user_token, device_imei) => {

    User.updateOne(
        {
            "devices.imei": device_imei, 
            token: user_token
        }, 
        {
            $set: {
                "devices.$.armed": new_status 
            }
        }
    )
        .exec()

        // If new_status was new value for DB, set action pending (different from prev value)
        .then((response) => {
            if (response.nModified !== 0) {

                // If pending is true and new status is also new -> remove pending flag
                getPending(device_imei).then((status) => {
                    if (status) {
                        setPending(device_imei, false)
                    } else {
                        setPending(device_imei, true)
                    }
                })
                
            }
        })
        .catch(err => console.log("ERR: change system status to ", new_status))
}

/* Arming the system */
router.get('/arm/:imei', (req, res) => {

    const user_token = req.cookies.token;
    const device_imei = req.params.imei;

    if (user_token === undefined || device_imei === undefined)
    {
        res.json({
            status: "Failure",
            reason: "Didn't reveice token and/or IMEI",
        })

        return;
    } 

    changeSystemStatus(true, user_token, device_imei)   

    res.json({
        status: "Success",
        reason: "System armed successfully"
    })
})

/* Disarming the system */
router.get('/disarm/:imei', (req, res) => {

    const user_token = req.cookies.token;
    const device_imei = req.params.imei;

    if (user_token === undefined || device_imei === undefined)
    {
        res.json({
            status: "Failure",
            reason: "Didn't reveice token and/or IMEI"
        })

        return;
    } 

    changeSystemStatus(false, user_token, device_imei)    
    res.json({
        status: "Success",
        reason: "System disarmed successfully"
    })
})


/* List all devices that user owns */
router.get('/listDevices', (req, res) => {

    const user_token = req.cookies.token

    if (user_token === undefined || user_token === null) {
        res.status(401)
        res.json({
            status: "Failure",
            reason: "Token missing"
        })
        
        return
    }

    var whatToReturn = [
        'notification_email',
        'connection_interval',
        'devices.imei',
        'devices.friendly_name',
        'devices.armed',
        'devices.pending',
        'devices.last_seen_timestamp',
        'devices.alert',
        'devices.environment',   
        'devices.connection_interval',   
        
    ]

    User.findOne({token: user_token}, whatToReturn)
        .then(response => {
            // Try to read devices from response
            try {
                if (response == null) {
                    res.status(401)
                    res.json({
                        status: "Not logged in",
                        reason: "Wrong token"
                    })
                    return
                }
                
            } catch(err) {
                res.json({
                    status: "Failure",
                    reason: "Couldn't find any device for token " + user_token
                })
                return;
            }
            
            try {

                if (response.devices === undefined || response.devices === null) {
                    res.json({
                        status: "No devices",
                        reason: "You don't have any devices... Yet."
                    })
                    return
                }

            } catch (err) {
                res.json({
                    status: "No devices",
                    reason: "You don't have any devices... "
                })
                return;
            }

            // Checks if user have devices at all
            if (response.devices.length === 0 || response.devices === null) {
                res.json({
                    status: "No devices",
                    reason: "You don't have any devices... Yet."
                })
                return
            }

            res.json(response)
        })
})

/* Change token to the database and don't send it to the user */
router.delete('/token', (req, res) => {
    
    const user_token = req.cookies.token

    if (user_token === null || user_token === undefined) {
        res.json({
            status: "Failure",
            reason: "Token can't be empty"
        })
        return
    }

    // Generating new token that user doesn't know
    require('crypto').randomBytes(48, function(err, buffer) {
        let random_token = buffer.toString('hex');
        if (random_token.length === (48*2)) {
            User.updateOne(
                {
                    token: user_token,
                },
                {
                    $set: {
                        token: random_token,
                    }
                }
            )
                .exec()
                .then(() => {
                    res.clearCookie("token");
                    res.json({
                        status: "Success",
                        reason: "Token removed from the database"
                    })
                })
                .catch(() => {
                    res.json({
                        status: "Failure", 
                        reason: "Server couldn't remove token from database"
                    })
                })
        }
    })
})

/* Check if username is taken */
const usernameTaken = async (username) => {

        let takenStatus
        
        await User.findOne(
            { username: username }
        )
            .then((result) => {

                if (result === null || result.lenght === 0) {
                    takenStatus = false
                } else {
                    takenStatus = true
                }
                
            })
            .catch(err => {
                console.log("ERR: @usernameTaken: ", err)
                takenStatus = true
            })
    
            return takenStatus
    
}

/* User registration */
router.post('/register', (req, res) => {

    const username = req.body.username
    const notificationEmail = req.body.notificationEmail
    const password = req.body.password
    const verifyPassword = req.body.verifyPassword

    // Check if all fields are filled (except notif. email because that isn't mandratory)
    if (
        username.length == 0 || 
        password.length == 0 || 
        verifyPassword.length == 0
    )   {
        res.json({
            status: "Failure", 
            reason: "Username or password missing"
        })
        return 
    }
    // Check if passwords match
    if (password !== verifyPassword) {
        res.json({
            status: "Failure", 
            reason: "Passwords doesn't match"
        })
        return
    }

    // Check if there is already user with that username
    usernameTaken(username)
        .then((taken) => {
            if (taken) {
                res.json({
                    status: "Failure",
                    reason: "Username is already taken"
                })
                return
            }

            const new_user = new User({
                username: username,
                user_email: "user@example.com",
                notification_email: notificationEmail,
                password: password,
                connection_interval: 20,
                last_login_timestamp: 0,
                last_login_addr: "none",
            })
            
            
            new_user.save().then(savedUser => {
                if (savedUser.username !== username) {
                    res.json({
                        status: "Failure",
                        reason: "Internal error on creating user"
                    })
                    return
                }
        
                res.json({
                    status: "Success", 
                    reason: "Account created"
                })
            })
        })
})

/* User login */
router.post('/login', (req, res) => {
    
    const username = req.body.username
    const password = req.body.password

    if (username === undefined || password === undefined) {
        res.json({
            status: "Failure", 
            reason: "user didn't pass username or password"
        })
        return
    }

    // Trying to find user with correct username and password
    User.find(
        {
            username: username,
            password: password
        }
    )
        .then((result) => {
            if (result[0] === undefined) {
                res.json({
                    status: "Failure",
                    reason: "Username or password incorrect"
                })
                return
            }

            // If username and password matches
            if (
                result[0].username === username.toString() &&
                result[0].password === password.toString()
            ) {
                require('crypto').randomBytes(48, function(err, buffer) {
                    let token = buffer.toString('hex');
                
                    if (token.length === (48*2)) {
                        // Token is long enough
                        User.updateOne(
                            {
                                username: username,
                                password: password,
                            },
                            {
                                $set: {
                                    "token": token
                                }
                            }
                        )
                            .exec()
                            .then(() => {
                                
                                res.cookie("token", token, {expire: (600000 + Date.now())});
                                res.json({
                                    status: "Success", 
                                    reason: "Token generated successfully",
                                })
                            })
                            .catch((err) => {
                                console.log(err)

                                res.json({
                                    status: "Failure",
                                    reason: "Server couldn't pass new geenrated token to the database",
                                    err: err
                                })

                            })
                        
                    } else {
                        res.json({
                            status: "Failure", 
                            reason: "Error @ token generating",
                        })
                    }
                }) // req crypto
            } else {
                res.json({
                    status: "Failure", 
                    reason: "Username and password didn't match"
                })
            }
        })
})

module.exports = router;