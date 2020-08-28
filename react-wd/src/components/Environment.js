import React from 'react'
import GeneralInfoBox from './GeneralInfoBox'
import { getClock, getDay } from './Clock'

const temp_img = require('../images/temp_img.png');	// Env temp

const Environment = (props) => {

    let temperature, lastSeen

    props.devices.map((device) => {
        if (device.imei == props.selectedDevice) {
            temperature = device.temperature / 10
            let t_lastSeen = new Date(device.last_seen * 1000)
            lastSeen = getDay(t_lastSeen, false) + " " + getClock(t_lastSeen)
            
            return
        }
    })


    return (
        <GeneralInfoBox 
            img_src={temp_img} 
            img_alt="thermometer" 
            top_text="Current temperature" 
            middle_text={temperature == undefined ? "-" : temperature + "°C"} 
            middle_text_color="#00E5FF" 
            bottom_text={"Last seen " + lastSeen} 
            
        />
    )
}

export default Environment