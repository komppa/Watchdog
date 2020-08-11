import React from 'react';

const GeneralButton = (props) => {


    const s_container = {
		height: props.height,
		width: props.width,
        display: "flex",
		float: "right",
	}

    let s_text = {
		color: props.text_color,
        margin: props.text_margin,
        fontSize: props.text_font_size,
    }
    
	const s_img_second = {
		margin: props.image_margin_second,
        height: props.image_size_second,
    }

    const s_img = {
		margin: props.image_margin,
        height: props.image_size,
    }

    if (props.on_bold) s_text.fontWeight = "bold"

    return(
        <div style={s_container} onClick={props.call}>
            <p style={s_text}>
                {props.text}
            </p>
            <img style={s_img_second} src={props.image_second} alt={props.image_second}></img>
            <img style={s_img} src={props.image} alt={props.image}></img>
        </div>
    );    
}

const DeviceButton = (props) => {
    return(
        <GeneralButton
            height="100%"
            width="100%"

            text_color="black"
            text_margin="auto auto auto 1vw"
            text_font_size="1.25vw"
            image_margin="auto 1vw auto 1vw"
            image_size="1.5vw"

            image_margin_second="auto 1vw auto 1vw"
            image_size_second="1.5vw"
            

            call={props.call}
            text={props.text}
            image={props.image}
            image_second={props.image_second}
            
            is_centered={true}
            on_bold={props.on_bold}
        />
    )
}

const BigButton = (props) =>{
    return(
        <GeneralButton
            height="100%"
            width="20vw"

            text_color="white"
            text_margin="auto 1vw auto auto"
            text_font_size="2vw"
            image_margin="auto auto auto 0"
            image_size="40%"

            call={props.call}
            text={props.text}
            image={props.image}

            is_centered={true}
            on_bold={true}
        />
    )
}



export {
    GeneralButton,
    DeviceButton,
    BigButton
}

