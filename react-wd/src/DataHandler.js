import Axios from 'axios'
import { srv_addr, api_addr } from './Config'

// Server env variables
var server_addr = srv_addr()
var api_path = api_addr()

const systemStatus = async (new_status, to_device) => {

    let statusObject = {}
    let command = new_status ? "arm" : "disarm"
    let url = server_addr + api_path + command + "/" + to_device
    
    await Axios.get(url, {withCredentials: true})
        .catch(err => console.log("ERR WITH setArm Data : ", err))
        .then((response) => {
            let status = response.data.status === "Success" ? true : false
            if (status) {
                statusObject = {
                    title: "System status changed",
                    text: "You have succefully changed system staus to " + command + "ed"
                }
            } else {
                statusObject = {
                    title: "System status changing failed",
                    text: "Reason: " + response.data.reason
                }
                
            }
        })

    return statusObject
}

const newDevice = async (new_imei, new_name) => {

    let statusObject = {}

    await Axios.get(server_addr + api_path + "addDevice/" + new_imei + '/' + new_name, {withCredentials: true})
        .then((response) => {

            let status = response.data.status === "Success" ? true : false
            if (status) {
                statusObject = {status: true, title: "New device added!", text: "You have added new device to your devices list"}
            } else {
                statusObject = {status: false, title: "Adding new device failed!", text: response.data.reason}
                
            }
            
        })
        .catch((error) => statusObject = {status: false, title: "Add new device fail", text: error})

    return statusObject
}

/*
const connectionInterval = async (new_ci) => {
    
    let statusObject = {}

    if (new_ci === undefined) {
        return
    }
    
    await Axios.get(server_addr + api_path + 'connectionInterval' + '/' + new_ci, {withCredentials: true})
        .then((response) => {
            let status = response.data.status == "Success" ? true : false
            
            if (status) {
                statusObject = {status: true, title: "Connection interval changed", text: response.data.reason}
                // setConnectionInterval(new_ci) !!!
            } else {
                statusObject = {status: false, title: "Connection interval changing failed", text: response.data.reason}
            }
        })
        .catch((error) => statusObject = {status: false, title: "Failed to change CI", text: "Couldn't change connection interval"})


    // Close settings modal
    //setShowSettings(false) !!
    return statusObject
}
*/

const changeSettings = async (new_ci, new_notif_email) => {

    //console.log("@changeSettings : " + new_ci + " " + new_notif_email)

    if (new_ci.length === 0) {
        console.log("new_ci = lenght 0 ")
        new_ci = -1
    }

    if (new_notif_email.length === 0) {
        console.log("new_notif_email = lenght 0 ")
        new_notif_email = -1
    }

    let statusObject = {}

    if (new_ci === undefined) {
        console.log("Couldn't send new settings to the server. Connection interval was empty")
        return
    }
    
    await Axios.get(server_addr + api_path + 'settings' + '/' + new_ci + "/" + new_notif_email, {withCredentials: true})
        .then((response) => {
            let status = response.data.status == "Success" ? true : false
            
            if (status) {
                statusObject = {status: true, title: "Connection interval changed", text: response.data.reason}
                // setConnectionInterval(new_ci) !!!
            } else {
                statusObject = {status: false, title: "Connection interval changing failed", text: response.data.reason}
            }
        })
        .catch((error) => statusObject = {status: false, title: "Failed to change CI", text: "Couldn't change connection interval"})


    // Close settings modal
    //setShowSettings(false) !!
    return statusObject
}


const logout = async () => {

    let statusObject = {}
    
    await Axios.delete(server_addr + api_path + "token", {withCredentials: true})
        .then((response) => {
            if (response.data.status === "Success") {
                statusObject = {status: true, title: "Logged out successfully", text: "See you soon!"}
                //showAnnonce("Logged out successfully", "You have logged out. See you soon!")
                //setIsLoggedIn(false)
                
            } else {
                statusObject = {status: false, title: "System failure", text: "Couldn't log out."}
            }
        })
        .catch((err) => statusObject = {status: false, title: "System failure", text: "Couldn't log out. " + err})

    return statusObject
}

const alertCheck = async (alert_id, alert_imei, alert_checked) => {

    let statusObject = {status: true}

    await Axios.get(server_addr + api_path + 'check/' + alert_imei + '/' + alert_id + '/' + !alert_checked, {withCredentials: true})
        .catch((error) => statusObject = {status: false, title: "Couldn't change alert status", text: error})

    return statusObject

}

export {
    systemStatus,
    newDevice,
    changeSettings,
    logout,
    alertCheck,
}