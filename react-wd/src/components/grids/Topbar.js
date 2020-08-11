import React from 'react'

const Topbar = (props) => {

    // Styling for TopBar
	const s_topBar = {
		backgroundColor: "#2E3442",
    	marginTop: "0vh",
		width: "100vw",
		height: "5vw",  /* height: "10vh",  */ 
    }
    
    return (
        <div style={s_topBar}>
            {props.children}
        </div>
    )
}

export default Topbar