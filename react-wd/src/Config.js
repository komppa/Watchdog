import React from 'react'

// Server env variables
var server_addr = "https://watchdog.rantakangas.com"
var api_path_addr = "/api/portal/"

const srv_addr = () => { return server_addr }
const api_addr = () => { return api_path_addr }

export {
    srv_addr,
    api_addr
}