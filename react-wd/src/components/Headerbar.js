import React from 'react'
import Underline from './Underline'

const Headerbar = (props) => {

    const s_header_box = {
        height: "3vw",
        width: "100%",
        position: "relative", 
		overflow: "hidden",
        display: "flex",
        alignItems: "center",
		justifyContent: "center",

    }

    const s_header = {
        fontSize: "1.5vw",
        margin: "auto auto auto 1vw",
        fontWeight: "bold",
        width: "40%",
    }

    const s_add_device = {
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

export default Headerbar