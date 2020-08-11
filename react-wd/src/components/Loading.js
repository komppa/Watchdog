import React, { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'


const wd_header = require('../images/Watchdog_TITLE.png');

const Loading = (props) => {

    const controls = useAnimation()

    controls.start({
        whileHover: { scale: 1.2 }
    })

    setTimeout(() => controls.start({ scale: 1.5 }), 200)

    const s_loading = {
        height: "100vh", 
        width: "100vw",
        position: "absolute",
        backgroundColor: "#2E3442",
        color: "white",
        zIndex: 100,
        display: "flex",
    }

    const s_img_wrapper = {
        backgroundColor: "#2E3442",
        margin: "auto",
    }

    const s_img = {
        height: "5vw",
    }

    const s_loading_text = {
        textAlign: "center",
        fontSize: "1vw",
    }

    return (
        <div style={s_loading}>
            <motion.div style={s_img_wrapper} animate={controls}>
                <img src={wd_header} alt="Watchdog logo" style={s_img}></img>
                <div style={s_loading_text}>Loading...</div>
            </motion.div>
        </div>
    )
}



export default Loading