import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Underline } from './Bottombar';
import { Button, FormGroup, FormControl, FormLabel, Form } from "react-bootstrap";
import { MDBInput } from "mdbreact";
import 'mdbreact/dist/css/mdb.css';
import {
	BrowserRouter as Router,
	Route,
    useHistory,
} from "react-router-dom";
import { srv_addr, api_addr } from '../Config'
import Modal from './Modal'

// Server env variables
var server_addr = srv_addr()
var api_path = api_addr()

const wd_header = require('../images/Watchdog_TITLE.png');
const watchdog_img = require('../images/watchdog.png');

const RegisterLogin = (props) => {

    const [username, setUsername] = useState()
    const [notificationEmail, setNotificationEmail] = useState()
    const [password, setPassword] = useState(null)
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [showTos, setShowTos] = useState(false)

    const handleSubmit = (event) => {

        event.preventDefault()

        let data = {
            username: username,
            notificationEmail: notificationEmail,
        }

        if (termsAccepted) {

            axios.post((server_addr + api_path + "register"), data, {withCredentials: true})
            .then((result) => {
                if (result.data.status === "Success") {
                    props.onRegistered(username, result.data.password)
                    
                } else {
                    alert(result.data.reason)
                }
            })
            .catch((err) => console.log("Couldn't register. " + err))

        } else {
            alert("You must accept ToS before using this service")
        }
            
    }

    
    

    const s_img = {
        height: "20vw",
        float: "right",
    }

    const s_inp = {
        color: "white", 
        fontSize: "1vw",
    }

    const s_checkbox = {
        marginLeft: "1vw",
        marginRight: "1vw",
        size: "4vw",
        msTransform: "scale(1.5vw)",
        mozTransform: "scale(1.5vw)",
        webkitTransform: "scale(1.5vw)",
        oTransform: "scale(1.5vw)",
        transform: "scale(1.5vw)",
    }    

    return (
        <>
            
            {
                showTos
                ? 
                    <div style={{position: "absolute", top: "0", left: "0"}}>
                        <Modal 
                        {...props}
                            onclick_cross={() => setShowTos(false)}
                            isTos={true}
                            title="Terms of Service" 
                        >
                            <p style={{color: "black"}}>
                            Please read this Terms of Service carefully before performing any actions on the service, Watchdog. Any participation in this service will constitute acceptance of this agreement. 
                            <br />
                            <br />
                            Watchdog service is a demo application which consists of Watchdog user interface and application software for Nordic Thingy91. Watchdog is intended to be used only for testing and/or demo purposes. Watchdog is to be used at user’s own discretion. 
                            <br />
                            <br />
                            Watchdog as a service doesn’t take any responsibility over data loss, protection, leakage and or anything else data related. Any actions involving information or data transfer between client, server and/or the device running the demo application software are done at user’s own risk. Data collected by the system will be stored for an indefinite amount of time.  
                            <br />
                            <br />
                            Watchdog also uses cookies to store information on the user's computer.   
                            <br />
                            <br />
                            Data likes when it’s transferred place to place.   
                            </p>
                        </Modal>
                    </div>
                : null
            }
                
            <Form onSubmit={handleSubmit}>
                <MDBInput autoFocus onChange={e => setUsername(e.target.value)} value={username} style={s_inp} label="Username" />
                <MDBInput onChange={e => setNotificationEmail(e.target.value)} value={notificationEmail} style={s_inp} label="Notification email (optional)" />
                
                <br />

                <label style={{marginLeft: "1vw",}}>
                <input
                    style={s_checkbox}
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={() => setTermsAccepted(!termsAccepted)}
                />I accept and indeed understand <label style={{color: "royalblue"}} onClick={() => setShowTos(true)}>terms of service</label></label>

                <br />
                <br />
                <br />

                <Button variant="primary" type="submit">Register</Button>
            </Form>

            <div style={{marginTop: "1vw"}}>
                <a href="/login">Already registered?<br />Log in here!</a>
            </div>
            
        </>
    )

}

const RegisterCredentials = (props) => {

    const handleGotoLogin = (event) => {
        event.preventDefault()
        //alert("handleGotoLogin")
        document.location.replace('/login')
    }

    return (
        <>
            <h3>Username: {props.u}</h3>
            <h3>Password: {props.p}</h3>
            <br />
            <Form onSubmit={handleGotoLogin}>
                <Button variant="primary" type="submit">Goto Login page</Button>
            </Form>
        </>
    )

}

const Register = (props) => {

    
    const [isregistered, setIsRegistered] = useState(false)
    const [usersUsername, setUsersUsername] = useState(null)
    const [generatedPassword, setGeneratedPassword] = useState(null)


    const handleIsRegistered = (isReg, username, password) => {
        setIsRegistered(true)
        setUsersUsername(username)
        setGeneratedPassword(password)
    }
    
    const s_loginContainer = {
        zIndex: "50",
        width: "40vw",
        height: "40vw", 
        margin: "auto",
    }

    const s_imgContainer = {
        height: "5vw",
    }

    const s_loginSite = {
        color: "white",
        zIndex: "50",
        width: "100vw",
        height: "100vh", 
        backgroundColor: "#2E3442",
        display: "flex",    
    }

    const s_sub_header = {
        marginTop: "4vw",
        height: "3vw",
    }
    
    const s_img = {
        position: "absolute",
        height: "20vw",
        right: "30vw",
        bottom: "5vw",
    }

    const s_inputContainer = {
        marginTop: "2vw",
    }

    
    
    return(
        <Route>
            <div style={s_loginSite}>
                <div style={s_loginContainer}>
                <div style={s_imgContainer}>
                    <img src={wd_header} style={{height: "100%"}}></img>
                </div>

                <Underline line_color={"#00E5FF"} /> 
                <h2 style={s_sub_header}>
                    {!isregistered ? "Create new account" : "Write those to piece of paper and click goto login page!"}
                </h2>
                <div style={s_inputContainer}>
                    {
                        !isregistered 
                        ? 
                            <RegisterLogin 
                                onRegistered={(username, password) => 
                                    handleIsRegistered(true, username, password)
                                } 
                            /> 
                        : 
                            <RegisterCredentials 
                                u={usersUsername} 
                                p={generatedPassword} 
                            />
                    }
                    <img src={watchdog_img} style={s_img}></img>
                </div>

                

                
            </div>  
            </div>
        </Route>
    )
}

export default Register