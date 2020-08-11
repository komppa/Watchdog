import React, { useState, useEffect } from 'react'
import GeneralInfoBox from './GeneralInfoBox'

const clock_img = require('../images/clock_img.png');	// Clock

const secondsEnbaled = false    // Do we show seconds everywhere time is present?

var time = new Date();
var daysOfWeek = [
	'Monday',
	'Tuesday',
	'Wedneday',
	'Tuesday',
	'Friday', 
	'Saturday',
	'Sunday',
]


const getClock = (time) => {
	let hours = (time.getHours() < 10 ? '0' : '') + time.getHours()
    let minutes = (time.getMinutes() < 10 ? '0' : '') + time.getMinutes()
    let seconds = secondsEnbaled ? "." + (time.getSeconds() < 10 ? '0' : '') + time.getSeconds() : ""
	return hours + "." + minutes + seconds
}

const getDay = (time, getYear = true) => {

	let date = time.getDate() + "." + ( time.getMonth() + 1)

	if (getYear) {
		date += "." + time.getFullYear()
	}

	return date
}

const getWday = (time) => daysOfWeek[time.getDay() - 1]

const Clock = () => {

    const [weekdayNow, setWeekdayNow] = useState(getWday(time))
    const [clockNow, setClockNow] = useState(getClock(time));
    const [dateNow, setDateNow] = useState(getDay(time))

    useEffect(() => {
        setTimeout(() => {
            time = new Date()
            setClockNow(getClock(time))
            setWeekdayNow(getWday(time))
            setDateNow(getDay(time))
        }, 1000)
    })

    return (
        <GeneralInfoBox 
            img_src={clock_img} 
            img_alt="clock" 
            top_text={weekdayNow}
            middle_text={clockNow}
            middle_text_color = "white"
            bottom_text={dateNow} 
        />
    )
}

export {
    Clock,
    getClock,
    getDay
}