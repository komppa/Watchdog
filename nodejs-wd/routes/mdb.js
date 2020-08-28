var dotenv = require('dotenv')
const mongoose = require('mongoose');
const { Int32 } = require('mongodb');

// DB's credentials are stored on sderc file
dotenv.config({path: './sderc.env'});

let host = process.env.DB_HOST
let username = process.env.DB_USER
let password = process.env.DB_PASSWORD

// MongoDB address
const url = "mongodb+srv://" + username + ":" + password + "@" + host + "/watchdog";

console.log("Connecting to ", url)

mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
.then(result => {
    console.log("Connected to the database");
})
.catch((error) => {
    console.log("Error with database connection requset: ", error)
})

const userSchema = new mongoose.Schema({
    token: String,
    username: String,
    user_email: String,
    notification_email: String,
    password: String,
    last_login_timestamp: Number,
    last_login_addr: String,
    connection_interval: Number,
    loa: Boolean,                   // Location on alert

    
    devices: [
        {
            imei: Number,
            iccid: Number,
            friendly_name: String,
            armed: Boolean,
            registration_timestamp: Number,
            last_seen_timestamp: Number,
            connection_interval: Number,
            pending: Boolean,               // Is armed status pending
            sln: Boolean,                   // Send location flag

            alert: [
                {
                    alert_timestamp: Number,
                    reason: String,
                    checked: Boolean,
                    location: {
                        latitude: Number,
                        longitude: Number
                    }
                }
            ],

            environment: [
                {
                    env_timestamp: Number,
                    temperature: Number,
                    humidity: Number,
                    air_quality: Number,
                    battery: Number,
                }
            ],

            location: [
                {
                    location_timestamp: Number,
                    latitude: Number,
                    longitude: Number,
                }
            ]
        }
    ]
})

module.exports = mongoose.model('User', userSchema)