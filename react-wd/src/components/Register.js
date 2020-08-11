import React, { useState } from 'react'
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

// Server env variables
var server_addr = srv_addr()
var api_path = api_addr()

const wd_header = require('../images/Watchdog_TITLE.png');

const Register = (props) => {

    const [username, setUsername] = useState()
    const [notificationEmail, setNotificationEmail] = useState()
    const [password, setPassword] = useState()
    const [verifyPassword, setVerifyPassword] = useState()

    const handleSubmit = (event) => {

        event.preventDefault()

        let data = {
            username: username,
            notificationEmail: notificationEmail,
            password: password,
            verifyPassword: verifyPassword,
        }

        axios.post((server_addr + api_path + "register"), data, {withCredentials: true})
            .then((result) => {
                if (result.data.status === "Success") {
                    document.location.replace('/login')
                } else {
                    alert(result.data.reason)
                }
            })
            .catch((err) => console.log("Couldn't register. " + err))
            
    }

    const s_loginSite = {
        color: "white",
        zIndex: "50",
        width: "100vw",
        height: "100vh", 
        backgroundColor: "#2E3442",
        display: "flex",    
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

    const s_inputContainer = {
        marginTop: "2vw",
    }

    const s_img = {
        height: "20vw",
        float: "right",
    }

    const s_inp = {
        color: "white", 
        fontSize: "1vw",
    }

    const s_sub_header = {
        marginTop: "4vw",
        height: "3vw",
    }
    
    return(
        <Route>
        <div style={s_loginSite}>
            <div style={s_loginContainer}>
                <div style={s_imgContainer}>
                    <img src={wd_header} style={{height: "100%"}}></img>
                </div>
                <Underline line_color={"#00E5FF"} /> 
                <h2 style={s_sub_header}>Create new account</h2>
                <div style={s_inputContainer}> {/* Blue box */}

                    <Form onSubmit={handleSubmit}>
                        <MDBInput autoFocus onChange={e => setUsername(e.target.value)} value={username} style={s_inp} label="Username" />
                        <MDBInput onChange={e => setNotificationEmail(e.target.value)} value={notificationEmail} style={s_inp} label="Notification email" />
                        <MDBInput onChange={e => setPassword(e.target.value)} value={password} style={s_inp} label="Password" type="password" />
                        <MDBInput onChange={e => setVerifyPassword(e.target.value)} value={verifyPassword} style={s_inp} label="Retype password" type="password" />
                        <br />
                        <Button variant="primary" type="submit">Register</Button>
                    </Form>

                    <div style={{marginTop: "1vw"}}>
                        <a href="/login">Already registered?<br />Log in here!</a>
                    </div>
                </div>
            </div>
        </div>
        </Route>
    )
}

export default Register