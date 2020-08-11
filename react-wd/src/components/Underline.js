import React from 'react'

const Underline = (props) => {

    let specified_color;

    if (props.line_color == null)
    {   
        specified_color = "white";
    } else {
        specified_color = props.line_color;
    }

    const s_line = {
        backgroundColor: specified_color,
        height: "1px", 
        width: "calc(100% - 2vw)",
        margin: "auto",
        float: "bottom",
    }

    return(
        <div style={s_line}></div>
    )
}

export default Underline