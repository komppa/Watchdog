import React, { useState, useEffect } from 'react'
import Modal from './Modal'

import { Map as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

const Wdmap = (props) => {

    const [noData, setNoData] = useState(false)

    const position = props.position

    const map_container_s = {
        height: "27.5vh",
        width: "40vw",
    }
    
    useEffect(() => {

        if (props.position[0] == 0 && props.position[1] == 0) {
            console.log("WDMAP > FAIL ", props.position)
            setNoData(true)
        } else {
            console.log("WDMAP > OK ")
            console.log("WDMAP > ", props.position)
            setNoData(false)
            
        }
        

        const L = require("leaflet");

        delete L.Icon.Default.prototype._getIconUrl;
        
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
            iconUrl: require("leaflet/dist/images/marker-icon.png"),
            shadowUrl: require("leaflet/dist/images/marker-shadow.png")
        });

    }, [])


    return (
        <Modal 
            {...props}
            onclick_cross={() => props.onclick_cross()}
            onclick_apply={() => props.onclick_cross()}
            title="Device location" 
            isTos={noData ? true : false}
        >
            

            
            {
                !noData
                ?
                    <>
                        <div style={{width: "100%",  textAlign: "center", marginBottom: "1vw"}}>
                            Location updated: {props.location_timestamp}
                        </div>

                        <LeafletMap center={position} zoom="10" style={map_container_s}>
                            <TileLayer
                                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                url='https://{s}.tile.osm.org/{z}/{x}/{y}.png'
                            />
                            <Marker position={position} draggable={false}>
                                <Popup>
                                    <h2><b>{props.deviceName}</b></h2>
                                    <p>Latitude: {props.position[0]} </p>
                                    <p>Longitude: {props.position[1]} </p>
                                </Popup>
                            </Marker>
                        </LeafletMap>
                    </>
                : 
                    <>
                        <h3>It seems like that your device hasn't got GPS fix.</h3>
                        <h3>Try again later by pressing 'find device'-button.</h3>
                    </>
            }
            

            </Modal>
    )

}

export default Wdmap