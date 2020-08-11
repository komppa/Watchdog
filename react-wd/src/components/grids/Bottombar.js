import React from 'react'

const Bottombar = (props) => {

    // Styling for BottomBar
	const s_bottomBar = {
        marginTop: "1vw",
        width: "100vw",
        height: "calc(" + props.windowHeight +"px - 18vw)",
        color: "white",
    }
    
    return (
        <div style={s_bottomBar}>
            {props.children}
        </div>
    )
}

export default Bottombar