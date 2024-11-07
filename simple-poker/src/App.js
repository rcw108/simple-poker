import React from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom' // Import react-router
import AppContent from './components/AppContent'
import BalanceOptions from './components/BalanceOptions' // New component
import MyProfile from './components/my-profile/MyProfile'
import PortalPopup from './components/portalPopup/PortalPopup'
import { BalanceProvider } from './providers/BalanceProvider'
import { TelegramProvider } from './TelegramProvider'

function App() {
	return (
		<TelegramProvider>
			<BalanceProvider>
				<Router>
					<Routes>
						<Route path='/' element={<AppContent />} />
						<Route path='/balance-options' element={<BalanceOptions />} />{' '}
						<Route path='/my-profile' element={<MyProfile />} />
						{/* Test confetti page */}
						{/* <Route path='/conf' element={<Confetti />} /> */}
					</Routes>
				</Router>
				<PortalPopup />
			</BalanceProvider>
		</TelegramProvider>
	)
}

export default App
