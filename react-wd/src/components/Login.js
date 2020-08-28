import React, { useState, useEffect } from 'react'
import { render } from 'react-dom';
import { Underline } from './Bottombar';
import { motion } from "framer-motion";
import { Button, FormGroup, FormControl, FormLabel, Form } from "react-bootstrap";
import axios from 'axios'
import { MDBInput } from "mdbreact";
import 'mdbreact/dist/css/mdb.css';
import { BrowserRouter as Router, Route, useHistory } from "react-router-dom";
import { srv_addr, api_addr } from '../Config'




// Server env variables
var server_addr = srv_addr()
var api_path = api_addr()

const wd_header = require('../images/Watchdog_TITLE.png');
const watchdog_img = require('../images/watchdog.png');



const Login = (props) => {

    const [username, setUsername] = useState()
    const [password, setPassword] = useState()

    const handleSubmit = (event) => {
        event.preventDefault()
        let data = {
            username: username,
            password: password,
        }
        axios.post((server_addr + api_path + "login"), data, {withCredentials: true})
            .then((result) => {
                if (result.data.status === "Success") {
                    document.location.replace('/dashboard')
                } else {
                    console.log("ERROR WITH LOGIN: ", result.data.err)
                    alert(result.data.reason)
                    setPassword("")
                }
            })
            .catch((err) => console.log("Couldn't log in. " + err))
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
        height: "20vw",
        width: "40vw",
        marginTop: "2vw",
    }

    const s_img = {
        position: "absolute",
        height: "20vw",
        right: "30vw",
        bottom: "5vw",
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

                <h2 style={s_sub_header}>Login</h2>

                
              
                <div style={s_inputContainer}>

                    <Form onSubmit={handleSubmit}>
                        <MDBInput autoFocus onChange={e => setUsername(e.target.value)} value={username} style={s_inp} label="Username" />
                        <MDBInput onChange={e => setPassword(e.target.value)} value={password} style={s_inp} label="Password" type="password" />
                        <br />
                        <Button variant="primary" type="submit">Login</Button>
                    </Form>

                    <div style={{marginTop: "4vw"}}>
                        <a href="/register">Doesn't have an account?<br />Register here!</a>
                    </div>

                    <img src={watchdog_img} style={s_img}></img>
                </div>
            </div>
        </div>
        </Route>
    )
}

export default Login