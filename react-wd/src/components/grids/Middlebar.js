import React from 'react'

const Middlebar = (props) => {

    // Styling for MiddleBar
	const s_middleBar = {
		marginTop: "1vw",
		width: "100vw",

		height: "10vw",
		color: "white"
    }
    
    return (
        <div style={s_middleBar}>
            {props.children}
        </div>
    )
}

export default Middlebar