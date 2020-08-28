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

const changeSettings = async (new_ci, new_notif_email) => {

    if (new_ci.length === 0) {
        new_ci = -1
    }
    
    if (new_notif_email === "") {
        if (new_notif_email === "") {
            new_notif_email = "-2"
        } else {
            new_notif_email = "-1"
        }
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
                statusObject = {status: true, title: "Settings saved", text: "Settings were saved to the database successfully"}
                // setConnectionInterval(new_ci) !!!
            } else {
                statusObject = {status: false, title: "Settings saving failed", text: response.data.reason}
            }
        })
        .catch((error) => statusObject = {status: false, title: "Failed to change settings", text: "Couldn't save settings to the database"})

    return statusObject
}


const logout = async () => {

    let statusObject = {}
    
    await Axios.delete(server_addr + api_path + "token", {withCredentials: true})
        .then((response) => {
            if (response.data.status === "Success") {
                statusObject = {status: true, title: "Logged out successfully", text: "See you soon!"}
                
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

const requestLocation = async (device_imei) => {

    let statusObject = {status: true}

    await Axios.get(server_addr + api_path + "request/location/" + device_imei, {withCredentials: true})
        .catch((error) => statusObject = {status: false, title: "Couldn't send location request", text: error})
        .then((response) => {
            if (response.data.status === "Success") {
                statusObject = {status: true, title: "Location request sent!", text: "Searching your device..."}
            } else {
                statusObject = {status: false, title: "Couldn't send location request", text: "Server didn't like your request"}
            }
        })

    return statusObject

}

const changeLocationOnAlert = async (new_value) => {

    let statusObject = {status: true}

    await Axios.get(server_addr + api_path + "loa/" + new_value , {withCredentials: true})
        .catch((error) => statusObject = {status: false, title: "Couldn't send location request", text: error})
        .then((response) => {
            if (response.data.status === "Success") {
                statusObject = {status: true, title: "Location request sent!", text: "Searching your device..."}
            } else {
                statusObject = {status: false, title: "Couldn't send location request", text: "Server didn't like your request"}
            }
        })

    return statusObject
    
}



export {
    systemStatus,
    newDevice,
    changeSettings,
    logout,
    alertCheck,
    requestLocation,
    changeLocationOnAlert,
}