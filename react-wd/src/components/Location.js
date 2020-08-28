import React from 'react'
import { ButtonComponent } from './System'
import { Button } from 'react-bootstrap'

const gps_img = require('../images/gps_img.png');
const map_new_img = require('../images/map_new_img.png');
const map_img = require('../images/map_img.png');


const Location = (props) => {

    var s_mainStyle = {
        backgroundColor: "#2E3442",
        marginLeft: "1vw",
        height: "10vw",
        width: "18.8vw", // Changed from 23.75
        float: "left",
        borderRadius: "5px",
    }

    let map_image = map_img

    if (props.new_location) {
        map_image = map_new_img
    } else {
        map_image = map_img
    }
    return (
        <ButtonComponent
            onclick_left_button={(props.onclick_find_device)}
            onclick_right_button={props.onclick_map}
            src_left_img={gps_img}
            src_right_img={map_image}
            alt_left_img="location"
            alt_right_img="map"
            left_text="find device"
            right_text="map"
        />
    )

}

export default Location