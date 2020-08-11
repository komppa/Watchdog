import React, { useState, useEffect } from 'react'
import SettingInput from './SettingInput'
import Modal from './Modal'
import 'mdbreact/dist/css/mdb.css';

const Settings = (props) => {

    const [connectionInterval, setConnectionInterval] = useState(props.connection_interval)
    const [notificationEmail, setNotificationEmail] = useState(props.notification_email)

    useEffect(() => {
        setConnectionInterval(props.connection_interval)
    }, [props.connection_interval])

    useEffect(() => {
        setNotificationEmail(props.notification_email)
    }, [props.notification_email])

    return (
        <Modal 
            {...props} 
            onclick_apply={() => props.onclick_apply(connectionInterval, notificationEmail)} 
            title="Settings" 
        >
            
            <SettingInput
                title="Connection interval"
                placeholder={connectionInterval}
                onchange_input={(e) => setConnectionInterval(e.target.value)}
            />

            <SettingInput
                title="Notification email"
                placeholder={notificationEmail}
                onchange_input={(e) => setNotificationEmail(e.target.value)}
            />
            
        </Modal>
    )
}

export default Settings