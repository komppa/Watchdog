import React from 'react'
import Headerbar from './Headerbar'
import Underline from './Underline'

const AlertRow = (props) => {

    const s_table_grid = {
        marginLeft: "1vw",
        fontSize: "1vw",
        width: "100%",
        height: "2vw",
        margin: "0.5vw 0 0.5vw 1vw"
    }

    const s_img_alerts = {
        height: "1.5vw",
        float: "left",
    }

    return(
        <div key={props.id} style={s_table_grid}>
            <div style={{float: "left", width: "30%"}}>{props.first_row}</div>  {/* Time */}
            <div style={{float: "left", width: "25%"}}>{props.second_row}</div> {/* Device */}
            <div style={{float: "left", width: "25%"}}>{props.third_row}</div>  {/* Reason 30*/}

            <div style={{float: "left", width: "15%", marginLeft: props.fourth_row == "Checked" ? "" : "1vw"}} onClick={props.onclick_checkedBtn}> {/* Checked */}
                <img style={s_img_alerts} src={props.img_src}></img>
                <div style={{marginLeft: props.fourth_row == "Checked" ? "" : "3vw"}}>
                    {props.fourth_row == "Checked" ? "Checked" : props.fourth_row}
                </div>
            </div>
        </div>     
    )
}

const Alerts = (props) => {

    // Styling for alerts alerts
	const s_table_header = {
        width: "90%", 
        margin: "2vw auto auto auto",
    }
    
    // Styling for alerts
	const s_alert_box = {
        backgroundColor: "#2E3442",
        position: "relative",
        height: "100%",
        width: "calc((23.75vw * 3) + 2vw)",  
        float: "right",
        marginRight: "1vw",
        borderRadius: "5px",
		//display: "flex",
		
    }
    
    const s_table_container = {
        height: "65%",
        width: "90%", 
		margin: "0.5vw auto auto auto",
		overflow: "auto",
    }
    
    return (
        <div style={s_alert_box}>

            <Headerbar title="Alerts" />
            <div style={s_table_header}>
                <AlertRow
                    first_row="Time"
                    second_row="Device"
                    third_row="Reason"
                    fourth_row="Checked"
                />

                <Underline /> 
            </div>

            <div style={s_table_container}>
                {props.children}
            </div>

        </div>
    )

}

export {
    Alerts,
    AlertRow,
}