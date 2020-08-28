import React, { useState, useCallback, useEffect } from 'react';
import { motion } from "framer-motion";
import ReactDOM from 'react-dom';
import { render } from "react-dom";
import './index.css';
import axios from 'axios';
import * as serviceWorker from './serviceWorker';
import { srv_addr, api_addr } from './Config'
import Login from './components/Login'
import Register from './components/Register'
import { Watchdog, ProtectedWatchdog } from './components/Watchdog'
import Loading from './components/Loading'
import { userState, getLoggedIn, setLoggedIn } from './components/UserState'
import {
	BrowserRouter as Router,
	Switch,
	Route,
	useHistory,
	Redirect,
} from "react-router-dom";


import Wdmap from './components/Wdmap';

// Server env variables
var server_addr = srv_addr()
var api_path = api_addr()

const App = () => {

	const [isLoading, setIsLoading] = useState(true)
	const history = useHistory()
	useEffect(() => {
		userState(server_addr, api_path, "listDevices")
		.then((userIsLoggedIn) => {

			setTimeout(() => setIsLoading(false), 250)

			if (userIsLoggedIn) {
				setLoggedIn(true)
			} else {
				setLoggedIn(false)
			}
		})
	}, [])
	

	return(
		<Router>

			{ isLoading ? <Loading isLoading={isLoading} /> :	null }

				<Route exact path="/kartta">
					
						<Wdmap
							deviceName = "Thingy:91"
							position = {[65, 25]}
						/>
					
				</Route>

				<Route exact path="/register">
					<Register />
				</Route>
			
				<Route exact path="/login" render={
					(props) => <Login {...props} />
				}></Route>

				<Route isLoading={isLoading} exact path="/dashboard">
					<ProtectedWatchdog />
				</Route>

				<Route exact path="/">
					<ProtectedWatchdog /> 
				</Route>

		</Router>
	)
}

ReactDOM.render(
	<App />,
		document.getElementById('root')
);

serviceWorker.unregister();