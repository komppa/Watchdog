import React from 'react';
import {useEffect, useState} from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import {GeneralButton, DeviceButton} from './GeneralButton';
import axios from 'axios';



const plus_btn_img = require('../images/plus_img.png');
const ok_img = require('../images/ok_img.png');
const warn_img = require('../images/warn_img.png');

// Battery images
const battery0_img = require('../images/battery0.png');
const battery1_img = require('../images/battery1.png');
const battery2_img = require('../images/battery2.png');
const battery3_img = require('../images/battery3.png');
const battery4_img = require('../images/battery4.png');

const lock_unlock_img = require('../images/lock_unlock_border_img.png');
const lock_lock_img = require('../images/lock_lock_border_img.png');

const Button = (props) => {

	const s_btnWrapper = {
		height: "100%",
		width: "100%",
        display: "flex",
	}

	const s_h3_btn_text = {
		color: "black",
        margin: "auto auto auto 1vw",
        fontSize: "1.25vw",
        float: "left",
    }

	const s_img_btn_image = {
        margin: "auto 1vw auto auto",
        width: "2vw",
        float: "right",
         
	}
	
	return(
		<div style={s_btnWrapper} onClick={props.call}>
			<p style={s_h3_btn_text}>{props.text}</p>
			<img style={s_img_btn_image} src={props.image} alt={props.image}></img>
		</div>
	)
}


const Device = (props) => {

    const s_device_box = {
        backgroundColor: "#FFA200",
        height: "3vw",
        width: "90%",
        margin: "1vw auto auto auto",
        borderRadius: "5px",
        //border: "solid black 7.5px",
    }

    // Check if text must be in bold
    let onBold = false
    if (props.selected) onBold = true // Bold

    let battImg
    let lockImg

    if (props.armed) {
        lockImg = lock_lock_img
    } else {
        lockImg = lock_unlock_img
    }

    


    let volt = props.battery

    if (volt >= 3966) battImg = battery4_img
    if (volt < 3966 && volt >= 3633) battImg = battery3_img
    if (volt < 3633 && volt >= 3366) battImg = battery2_img
    if (volt < 3366 && volt >= 3000) battImg = battery1_img
    if (volt < 3000 && volt > 0) battImg = battery0_img

    return(
        <div key={props.id} onClick={props.onclick_device} style={s_device_box}>
            <DeviceButton
                text={props.name}
                image={battImg}
                image_second={lockImg}
                on_bold={onBold}
            />
        </div>
    )
}

const Underline = (props) => {

    let specified_color;

    if (props.line_color == null)
    {   
        specified_color = "white";
    } else {
        specified_color = props.line_color;
    }

    const s_line = {
        backgroundColor: specified_color,
        height: "1px", 
        width: "calc(100% - 2vw)",
        margin: "auto",
        float: "bottom",
    }

    return(
        <div style={s_line}></div>
    )
}

const HeaderBar = (props) => {

    const s_header_box = {
        //backgroundColor: "black",
        height: "3vw",
        width: "100%",

        position: "relative", 
		overflow: "hidden",
        display: "flex",
        alignItems: "center",
		justifyContent: "center",

    }

    const s_header = {
        //backgroundColor: "red",
        fontSize: "1.5vw",
        margin: "auto auto auto 1vw",
        fontWeight: "bold",
        width: "40%",
    }

    const s_add_device = {
        //backgroundColor: "blue",
        fontSize: "1vw",
        float: "right", 
        width: "5vw", 
    }

    const s_line = {
        backgroundColor: "white",
        height: "1px", 
        width: "calc(100% - 2vw)",
        margin: "auto",
        float: "bottom",
    }

    const s_plus_img = {
        margin: "auto 1vw auto 0.25vw",
        height: "1.25vw",
    }

    return(
        <div>
            <div style={s_header_box}>
                <p style={s_header}>
                    {props.title}
                </p>
                
                <p onClick={props.onclick_rightImg} style={s_add_device}>
                    {props.text}
                </p>
                <img onClick={props.onclick_rightImg} src={props.img_src} alt={props.img_alt} style={s_plus_img}></img>
            </div>
            <Underline line_color={props.line_color} />
        </div>
    )
}

const TableRow = (props) => {
    const s_table_grid = {
        marginLeft: "1vw",
        fontSize: "1vw",
        width: "100%",
        height: "2vw",
        margin: "0.5vw 0 0.5vw 1vw"
    }

    const s_img_alerts = {
        height: "1.5vw",
        float: "left",
    }

    return(
        <div key={props.id} style={s_table_grid}>
            <div style={{float: "left", width: "30%"}}>{props.first_row}</div>  {/* Time */}
            <div style={{float: "left", width: "25%"}}>{props.second_row}</div> {/* Device */}
            <div style={{float: "left", width: "25%"}}>{props.third_row}</div>  {/* Reason 30*/}

            <div style={{float: "left", width: "15%", marginLeft: props.fourth_row == "Checked" ? "" : "1vw"}} onClick={props.onclick_checkedBtn}> {/* Checked */}
                <img style={s_img_alerts} src={props.img_src}></img>
                <div style={{marginLeft: props.fourth_row == "Checked" ? "" : "3vw"}}>
                    {props.fourth_row == "Checked" ? "Checked" : props.fourth_row}
                </div>
            </div>
        </div>     
    )
}

export {
    HeaderBar,
    Device,
    TableRow,
    Underline
};
