import React, { useEffect } from 'react'

/* General box for component 'WDay, Date and clock' and 'environmental' */
const GeneralInfoBox = (props) => {	

    const s_mainStyle = {
        backgroundColor: "#2E3442",
        marginLeft: "1vw",
        height: "10vw",
        width: "18.8vw", // Changed from 23.75
        float: "left",
        borderRadius: "5px",
    }

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
	}

	const s_smallText = {
		fontSize: "1vw",
	}

	const s_bigText = {
		fontSize: "3.5vw",
		width: "100%",
		color: props.middle_text_color,
    };

	return(
		<div style={s_mainStyle}>
			<div style={s_imageAndTextWrapper}>
				<img style={s_img} src={props.img_src} alt={props.img_alt} />
				<div style={s_texts}>
					<div style={s_smallText}>{props.top_text}</div>
					<div style={s_bigText}>{props.middle_text}</div>
					<div style={s_smallText}>{props.bottom_text}</div>
				</div>
			</div>
		</div>
	)
}


export default GeneralInfoBox