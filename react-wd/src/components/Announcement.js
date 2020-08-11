import React from 'react'
import { Underline } from './Bottombar'
import { motion, useAnimation } from 'framer-motion'

const Announcement = (props) => {

    const controls = useAnimation()

    controls.start({
        scale: 1.1,
        whileHover: {scale: 1.1}
    })

    setTimeout(() => {
        controls.start({
            scale: 0.0
        })  
    },3850)



    const s_anno = {
        position: "absolute",

        width: "15vw",
        height: "7.5vw", 

        zIndex: "20",

        borderRadius: "5px",

        backgroundColor: "#00E5FF",

        left: "84vw",
        top: "82.5vh"
    }

    const s_title = {
        fontSize: "1vw",
        fontWeight: "bold",
        marginLeft: "1vw",
        textAlign: "left",
    }

    const s_text = {
        fontSize: "0.75vw", 
        
        margin: "0.5vw 1vw  auto 1vw"
    }

    return(
        <div>
            <motion.div style={s_anno} animate={controls}>
                <div style={s_title}>{props.content.title}</div>
                <Underline line_color="black" />
                <div style={s_text}>{props.content.text}</div>
            </motion.div>
        </div>
    )
}

export default Announcement