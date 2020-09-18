import React, { useState, useRef, useEffect } from 'react';
import {HeaderBar, Underline} from '../components/Bottombar'

const check_img = require('../images/settings/check_img.png');
const redcross = require('../images/settings/redcross_img.png');
const cross_img = require('../images/settings/cross_img.png');

const apply_img = require('../images/apply_img.png');
const cancel_img = require('../images/cancel_img.png');

const Modal = (props) => {
    
    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClicks);
        return () => document.removeEventListener('mousedown', handleOutsideClicks)    
    }, [])
    
    const modal_dimmerground = {
        position: "absolute",
        height: "100vh", 
        width: "100vw",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: "10",
    }

    var modal_box = {
        backgroundColor: "white", // #00E5FF
        borderRadius: "5px",
        zIndex: "11",
        position: "relative",
        height: "45vh",
        width: "45vw",
        top: "27.5vh",
        left: "27.5vw",
        dispaly: "flex",
    }

    
    const modal_content_box = {
        fontSize: "1.1vw",
        height: "25vh",
        width: "40vw",
        backgroundColor: "white",
        margin: "5vh auto 0 auto",

    }

    const modal_button_box = {
        height: "5vh",
        width: "40vw",
        backgroundColor: "white",
        margin: "auto",
    }

    const s_input = {
        fontSize: "1.1vw",
        border: "black",
        borderWidth: "2px", 
        boxShadow: "none",
        borderBottom: "1px solid black",
        backgroundColor: "#00E5FF",
        margin: "1vw auto auto 1vw",
        width: "30%",

    }

    const s_btn_img = {
        height: "100%",
        float: "right",
        margin: "auto auto auto 1vw"
    }

    const s_field_text = {
        width: "35%",
        display: "inline-block",
    }

    const modal_box_ref = useRef(null);

    const closeModal = () => {
        props.onclick_cross();
    }

    const handleOutsideClicks = element => {
        if (!modal_box_ref.current.contains(element.target)) {
            closeModal();
        }
    }

    if (props.isTos) {
        modal_box.height = "57.5vh"
    }

    return(
        <div style={modal_dimmerground}>
            <div ref={modal_box_ref} style={modal_box}>

                <HeaderBar
                    title={props.title}
                    line_color="black"
                    img_src={cross_img}
                    onclick_rightImg={() => closeModal()}
                />


                <div style={modal_content_box}>
                    {props.children}
                </div>

                {
                    !props.isTos
                    ?
                        <div style={modal_button_box}>
                            <img src={apply_img} style={s_btn_img} onClick={() => props.onclick_apply()}></img>
                            <img src={cancel_img} style={s_btn_img} onClick={() => closeModal()}></img>
                        </div>
                    : null
                }
                

            </div>
        </div>
    )        

    


}

export default Modal;
