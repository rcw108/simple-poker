import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCookieHelper, setCookieHelper } from '../utils/cookieHelper.js'
const BalanceContext = createContext()

const soundCookieName = 'sound'

export const BalanceProvider = ({ children }) => {
	const [balance, setBalance] = useState(100)
	const [sound, setSound] = useState(true)

	useEffect(() => {
		getCookieHelper(soundCookieName) === 'true'
			? setSound(true)
			: setSound(false)
	}, [])

	useEffect(() => {
		setCookieHelper(soundCookieName, sound)
	}, [sound])

	return (
		<BalanceContext.Provider value={{ balance, setBalance, sound, setSound }}>
			{children}
		</BalanceContext.Provider>
	)
}

export const useBalance = () => useContext(BalanceContext)
