import React, { useEffect } from 'react'
import Modal from './Modal'

import { Map as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

const Wdmap = (props) => {

    const position = props.position

    const map_container_s = {
        height: "30vh",
        width: "40vw",
    }
    
    React.useEffect(() => {

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
            title="Device location" 
        >

            <LeafletMap center={position} zoom="15" style={map_container_s}>
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

            </Modal>
    )

}

export default Wdmap