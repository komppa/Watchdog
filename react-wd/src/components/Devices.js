import React from 'react'
import Headerbar from './Headerbar'

const plus_btn_img = require('../images/plus_img.png');	//For adding a new device

const Devices = (props) => {

    // Styling for devices box
	const s_device_box = {
        backgroundColor: "#2E3442",
        marginLeft: "1vw",
        position: "relative",
        height: "100%", 
        width: "23.75vw",
        float: "left",
        borderRadius: "5px",
    }
    
    return (
        <div style={s_device_box}>

            <Headerbar
                title = {"Devices"}
                text = {"add device"}
                img_src = {plus_btn_img}
                img_alt = {"plus sign"}
                onclick_rightImg = {() => props.onclick_addDevice()}
            /> 

            {props.children}

        </div>
    )
}

export default Devices