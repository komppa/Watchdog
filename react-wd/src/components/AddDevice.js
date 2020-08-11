import React, { useState } from 'react'
import SettingInput from './SettingInput'
import Modal from './Modal'

const AddDevice = (props) => {

    const [imei, setImei] = useState(null)
    const [fname, setFname] = useState(null)

    let cont = {
        "title": "Add new device",  
        "fields": [ 
            {
                text: "Device's IMEI",
                placeholder: ""
            },	
            { 
                text: "Device's friendly name",
                placeholder: ""
            } 
        ]
    }

    return (
        <Modal 
            {...props}
            title={cont.title}
            onclick_apply={() => props.onclick_apply(imei, fname)}
        >
            
            <SettingInput
                title="IMEI"
                onchange_input={(e) => setImei(e.target.value)}
            />

            <SettingInput
                title="Friendly name"
                onchange_input={(e) => setFname(e.target.value)}
            />

        </Modal> 
    )
}

export default AddDevice