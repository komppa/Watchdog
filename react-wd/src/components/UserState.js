import React from 'react'
import Axios from 'axios'

var loggedIn = true


const setLoggedIn = (new_value) => {
    loggedIn = new_value
}

const getLoggedIn = () => {
    return loggedIn
}

const userState = async (server_addr, api_path, endpoint) => {

    let userIsLoggedIn

    await Axios.get(server_addr + api_path + endpoint, {withCredentials: true})
        .then((response) => {
            console.log(response)
            if (response.status === 200) {
                userIsLoggedIn = true
            }
            
        })
        .catch((err) => {

            if (err  == "Error: Network Error") {
                return
            }

            if (err.response.status === 401) {
                userIsLoggedIn = false
            } else {
                console.log("Error when checking if user is logged in. ", err)
            }
        })

    return userIsLoggedIn
}

export {
    userState,
    getLoggedIn,
    setLoggedIn
}