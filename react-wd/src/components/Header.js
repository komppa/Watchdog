import React from 'react';

const wd_header = require('../images/Watchdog_TITLE.png');

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

export default Header