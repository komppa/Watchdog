import React, { useState, useEffect } from 'react'
import SettingInput from './SettingInput'
import Modal from './Modal'
import 'mdbreact/dist/css/mdb.css';
import { changeLocationOnAlert } from '../DataHandler'

const Settings = (props) => {

    const [connectionInterval, setConnectionInterval] = useState(props.connection_interval)
    const [notificationEmail, setNotificationEmail] = useState(props.notification_email)
    const [checkboxChecked, setCheckboxChecked] = useState(props.location_on_alert)

    useEffect(() => {
        setConnectionInterval(props.connection_interval)
    }, [props.connection_interval])

    useEffect(() => {
        setNotificationEmail(props.notification_email)
    }, [props.notification_email])

    const handleCheckboxChange = () => {
        setCheckboxChecked(!checkboxChecked)
        changeLocationOnAlert(!checkboxChecked)
    }

    return (
        <Modal 
            {...props} 
            onclick_apply={() => props.onclick_apply(connectionInterval, notificationEmail)} 
            title="Settings" 
        >
            
            <SettingInput
                title="Connection interval"
                isCheckbox={false}
                placeholder={connectionInterval}
                onchange_input={(e) => setConnectionInterval(e.target.value)}
            />

            <SettingInput
                title="Notification email"
                isCheckbox={false}
                placeholder={notificationEmail}
                onchange_input={(e) => setNotificationEmail(e.target.value)}
            />

            <SettingInput
                title="Location on alert"
                isCheckbox={true}
                checkbox_checked={checkboxChecked}
                onchange_input={() => handleCheckboxChange()}
            />
            
        </Modal>
    )
}

export default Settings