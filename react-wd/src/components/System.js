import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';

const clock_img = require('../images/clock_img.png');
const temp_img = require('../images/temp_img.png');
const lock_unlock_img = require('../images/lock_unlock_img.png');
const lock_lock_img = require('../images/lock_lock_img.png');
const line_img = require('../images/line.png');

// const home_btn_img = require('../images/HOME.png');
const home_btn_img = require('../images/home_img_without_text.png');

// const away_btn_img = require('../images/AWAY.png');
const away_btn_img = require('../images/away_img_without_text.png');

const s_mainStyle = {
	backgroundColor: "#2E3442",
	marginLeft: "1vw",
	height: "10vw",
	width: "18.8vw", // Changed from 23.75
	float: "left",
	borderRadius: "5px",
}

/* System status, if system is armed or disarmed */
const SystemStatus = (props) => {

	let systemArmed = false
	let systemName, systemPending

    props.devices.map((device) => {
        if (device.imei == props.selectedDevice) {
			systemArmed = device.armed
			systemName = device.name === undefined ? device.imei : device.name
			systemPending = device.pending === undefined ? false : device.pending
            return
        }
	})
	
	const s_img = {
		position: "relative",
		width: "20%",
		float: "left",
		left: "1.5vw",
	}

	const s_imageAndTextWrapper = {
		height: "100%",
		width: "100%",
		float: "right", 
		display: "flex", 
		flexDirection: "row",
		flexWrap: "wrap", 
		justifyContent: "center", 
		alignItems: "center", 
	}

	const s_texts = {
		position: "relative",
		width: "10vw",
		height: "auto", 
		textAlign: "center",
		fontWeight: "bold",
		margin: "0 auto",
		padding: "10px",
		marginLeft: "2vw",
	}
	
	const s_topText = {
		textAlign: "left",
		fontSize: "1vw",
		height: "1.5vw",
	}

	let s_bottomText = {
		width: "100%",
		textAlign: "left",
		fontSize: "0.75vw",
		height: "1.5vw",
	}

	const s_bigText = {
		textAlign: "left",
		fontSize: "2.5vw",
		width: "100%",
	}

	let img_scr, img_alt, top_text, middle_text, bottom_text, text_color;

	if (systemPending) {
		
		/* 
		If system is pending:
			- armed status from DB isn't authentic
			- middle-text should be negation from armed status
			- bottom-text should be authentic value
		*/

		middle_text = systemArmed ? "DISARMED" : "ARMED" // Negation
		bottom_text = systemArmed ? "ARMING REQUEST PENDING" : "DISARMING REQUEST PENDING"

		if (!systemArmed) {
			s_bottomText.color = "#00FFA8"
			img_scr = lock_lock_img
			img_alt = "lock"
			top_text = systemName
			text_color = "#FF0000"	
		} else {
			s_bottomText.color = "#FF0000"
			img_scr = lock_unlock_img
			img_alt = "unlock"
			top_text = systemName
			text_color = "#00FFA8"
		}
		
		
	} else {
		// If system is not pending, database includes authentic armed status
		middle_text = systemArmed ? "ARMED" : "DISARMED"
		bottom_text = ""

		if (systemArmed) {
			img_scr = lock_lock_img
			img_alt = "lock"
			top_text = systemName
			text_color = "#FF0000"
		} else {
			img_scr = lock_unlock_img
			img_alt = "unlock"
			top_text = systemName
			text_color = "#00FFA8"
		}
	}
	
	top_text += "'s status"

	return(
		<div style={s_mainStyle}>
			<div style={s_imageAndTextWrapper}>
				<img style={s_img} src={img_scr} alt="lock" />
				<div style={s_texts}>
					<div style={s_topText}>{top_text}</div>

					<div style={{
						textAlign: "left",
						fontSize: "2.25vw",
						width: "100%",
						color: text_color,
					}}>
						{middle_text}
					</div>

					<div style={s_bottomText}>{bottom_text}</div>
				</div>
			</div>
		</div>
	)
	
}

const ButtonComponent = (props) => {

	const s_line_div = {
		float: "left",
		height: "100%",
		width: "2%",
		display: "flex",
	}

	const s_line = {
		height: "6vw",
		margin: "auto",
	}

	const s_right_box = {
		float: "right", 
		height: "100%",
		width: "49%", 
		display: "flex",
		margin: "1vw auto auto auto",
		flexDirection: "column",
		alignItems: "stretch",
		justifyContent: "center",
		alignItems: "center",
		justifyContent: "center",
		alignItems: "center",
	}

	const s_left_box = {
		float: "left",
		height: "100%", 
		width: "49%",
		display: "flex",
		margin: "1vw auto auto auto",
		flexDirection: "column",
		alignItems: "stretch",
		justifyContent: "center",
		alignItems: "center",
	}

	const s_btn_img_wrapper = {
		width: "70%",
		height: "40%",
		alignItems: "center",
		justifyContent: "center",
		display: "flex",
	}

	const img_text_s = {
		width: "50%",
		height: "20%",
		fontSize: "1vw",
		fontWeight: "bold",
		textAlign: "center",
		marginTop: "0.5vw",
	}

	return (
		<div style={s_mainStyle}>

			<div onClick={props.onclick_left_button} style={s_left_box}>
				<div style={s_btn_img_wrapper}>
					<img 
						src={props.src_left_img} 
						alt={props.alt_left_img} 
						style={{height: "100%", backgroundSize: "cover", margin: "0"}}>
					</img>
				</div>
				<div style={img_text_s}>{props.left_text}</div>
			</div>


			<div style={s_line_div}>
				<img src={line_img} alt="line" style={s_line}></img>
			</div>

			<div onClick={props.onclick_right_button} style={s_right_box}>
				<div style={s_btn_img_wrapper}>
					<img
						src={props.src_right_img} 
						alt={props.alt_right_img} 
						style={{height: "100%", backgroundSize: "cover"}}>
					</img>
				</div>
				<div style={img_text_s}>{props.right_text}</div>
			</div>

		</div>
	)
}

/* Change system status between armed (away) and disarmed (home) */
const ChangeStatus = (props) => {
	return(
		<ButtonComponent
			onclick_left_button={props.onclick_disarm}
			onclick_right_button={props.onclick_arm}
			src_left_img={home_btn_img}
			src_right_img={away_btn_img}
			alt_left_img="home"
			alt_right_img="away"
			left_text="home"
			right_text="away"
		/>
	)
}

export {
	SystemStatus,
	ChangeStatus,
	ButtonComponent
};