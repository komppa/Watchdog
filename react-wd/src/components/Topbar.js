import React from 'react';
import {BigButton} from './GeneralButton';

/* import logo from '../images/Watchdog_TITLE.png'; */

const wd_header = require('../images/Watchdog_TITLE.png');
const settings_img = require('../images/settings_img.png');
const logout_img = require('../images/logout_img.png');


const f_logout = () => {
	alert("You have been logged out!")
}

const Header = () => {

	const s_headerWrapper = {
		height: "100%",
		width: "50%",
		position: "relative",
		float: "left",
		overflow: "hidden"
	}

	const s_headerImg = {
		display: "block",
		position: "absolute",
		left: "1vw",
		height: "100%"
	}

	return(
		<div style={s_headerWrapper}>
			<img style={s_headerImg} src={wd_header} alt="Watchdog's logo"></img>
		</div>
	)
}

const Button = (props) => {

	const s_btnWrapper = {
		height: "100%",
		width: "20vw",
		display: "flex",
		float: "right",
	}

	const s_h3_btn_wrapper = {
		color: "white",
        margin: "auto 1vw auto auto",
		fontSize: "2vw"
	}

	const s_img_btn_wrapper = {
		margin: "auto auto auto 0",
		height: "40%"
	}
	
	return(
		<div style={s_btnWrapper} onClick={props.call}>
			<h3 style={s_h3_btn_wrapper}>{props.text}</h3>
			<img style={s_img_btn_wrapper} src={props.image} alt={props.image}></img>
		</div>
	)
}


const Topbar = (props) => {

	const s_topBar = {
		backgroundColor: "#2E3442",
    	marginTop: "0vh",
		width: "100vw",
		height: "5vw",  /* height: "10vh",  */ 
	}

	return(
		<div style={s_topBar}>
			<Header />
			<BigButton
				text="LOG OUT"
				image={logout_img}
				call={() => f_logout()}
			/>

			<BigButton
				text="SETTINGS"
				image={settings_img}
				call={props.onclick_settings}
			/>

		</div>
	)
}

export default Topbar;