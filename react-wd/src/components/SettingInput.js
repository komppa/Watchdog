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
}

export default SettingInput