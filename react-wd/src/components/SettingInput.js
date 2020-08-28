import React from 'react'

const SettingInput = (props) => {

    const s_container = {
        marginBottom: "1vw",
    }

    const s_label = {
        width: "15vw",
        display: "inline-block",
    }

    const s_input = {
        marginLeft: "1vw",
        width: "15vw",
        color: "black",
        backgroundColor: "transparent",
        border: 0,
        outline: 0,
        borderBottom: "1px solid black",
        fontSize: "1vw",
    }

    const s_checkbox = {
        marginLeft: "1vw",
        size: "4vw",
        msTransform: "scale(1.5vw)",
        mozTransform: "scale(1.5vw)",
        webkitTransform: "scale(1.5vw)",
        oTransform: "scale(1.5vw)",
        transform: "scale(1.5vw)",
    }

    if (!props.isCheckbox) {
        return (
            <div style={s_container}>
                <label style={s_label}>{props.title}</label>
                <input
                    style={s_input}
                    type="text"
                    onChange={props.onchange_input}
                    value={props.placeholder}
                />
            </div>
        )
    } else {
        return (
            <div style={s_container}>
                <label style={s_label}>{props.title}</label>
                <input
                    style={s_checkbox}
                    type="checkbox"
                    checked={props.checkbox_checked}
                    onChange={() => props.onchange_input()}
                />
            </div>
        )
    }
 
    
}
//<input type="checkbox" id="vehicle1" name="vehicle1" value="Bike">


export default SettingInput