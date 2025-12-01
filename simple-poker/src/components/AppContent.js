import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PokerTable from './PokerTable'
import { useTelegram } from './useTelegram'
import { API_BASE_URL } from '../config'

function AppContent() {
	const { user, webApp } = useTelegram()
	const [isTelegramWebAppDetected, setIsTelegramWebAppDetected] =
		useState(false)
	const [isUserVerified, setIsUserVerified] = useState(false) // Track if user verification is successful
	const [loading, setLoading] = useState(true) // Track loading state
	const [error, setError] = useState(null) // Track errors
	const navigate = useNavigate() // Initialize navigate inside the component

	useEffect(() => {
		// Check if Telegram WebApp is available
		if (window.Telegram && window.Telegram.WebApp) {
			const tg = window.Telegram.WebApp
			tg.ready() // Notify Telegram that the app is ready
			setIsTelegramWebAppDetected(true) // Telegram WebApp detected

			// Extract user data from the WebApp
			const initData = tg.initData // Authenticated data
			const initDataUnsafe = tg.initDataUnsafe // User data

			console.log('Telegram Init Data:', initData)
			console.log('Telegram User Data:', initDataUnsafe)

			// Only send verification request if user data is available
			if (initDataUnsafe && initDataUnsafe.user && initDataUnsafe.user.id) {
				console.log('Sending verification request to:', `${API_BASE_URL}/api/verifyUser`)
				console.log('User ID:', initDataUnsafe.user.id)
				console.log('API_BASE_URL:', API_BASE_URL)
				
				// Send user data to the backend for verification
				fetch(`${API_BASE_URL}/api/verifyUser`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'ngrok-skip-browser-warning': 'true',
					},
					body: JSON.stringify({
						initData, // Authenticated Telegram data
						initDataUnsafe, // Telegram user data
					}),
				})
					.then(async res => {
						console.log('Response status:', res.status, res.statusText)
						console.log('Response headers:', res.headers)
						
						let data
						try {
							data = await res.json()
							console.log('Response data:', data)
						} catch (e) {
							console.error('Failed to parse response as JSON:', e)
							const text = await res.text()
							console.error('Response text:', text)
							throw new Error(`Invalid JSON response: ${text}`)
						}
						
						if (!res.ok) {
							throw new Error(data.message || `Server error: ${res.status}`)
						}
						return data
					})
					.then(data => {
						if (data.success) {
							console.log('✅ User verified and added to the database:', data)
							setIsUserVerified(true) // Mark user as verified
							setError(null) // Clear any previous errors
						} else {
							const errorMsg = data.message || 'Unknown error verifying user'
							console.error('❌ Error verifying user:', errorMsg)
							setError(errorMsg)
							setIsUserVerified(false) // Mark user as not verified
						}
						setLoading(false) // Stop loading
					})
					.catch(error => {
						const errorMsg = error.message || 'Failed to connect to backend server'
						console.error('❌ Error sending data to the backend:', error)
						console.error('Error details:', {
							message: error.message,
							stack: error.stack,
							apiUrl: `${API_BASE_URL}/api/verifyUser`
						})
						setError(`${errorMsg}. Check if backend server is running at ${API_BASE_URL}`)
						setIsUserVerified(false) // Mark user as not verified on error
						setLoading(false) // Stop loading
					})
			} else {
				const errorMsg = 'Telegram user data is not available. Make sure you are accessing this app from Telegram.'
				console.error(errorMsg)
				setError(errorMsg)
				setIsUserVerified(false)
				setLoading(false)
			}
		} else {
			const errorMsg = 'Telegram WebApp is not available. Please open this app in Telegram.'
			console.error(errorMsg)
			setError(errorMsg)
			setIsTelegramWebAppDetected(false) // Telegram WebApp not detected
			setLoading(false) // Stop loading
		}
	}, [])

	if (loading) {
		return <div>Loading...</div>
	}

	if (!isTelegramWebAppDetected) {
		return <div>Make sure this web app is opened in Telegram client.</div>
	}

	if (!isUserVerified) {
		return (
			<div style={{ 
				padding: '20px', 
				textAlign: 'center',
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#1a1a1a',
				color: '#fff'
			}}>
				<div style={{ fontSize: '24px', marginBottom: '20px', color: '#e74c3c' }}>
					❌ Error
				</div>
				{error && (
					<div style={{ 
						fontSize: '16px', 
						marginBottom: '20px', 
						color: '#ff6b6b',
						maxWidth: '500px',
						padding: '15px',
						backgroundColor: '#2a2a2a',
						borderRadius: '8px',
						border: '1px solid #e74c3c'
					}}>
						{error}
					</div>
				)}
				<div style={{ marginTop: '20px', fontSize: '14px', color: '#999' }}>
					API URL: {API_BASE_URL}/api/verifyUser
				</div>
				<div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
					Check browser console (F12) for detailed error messages.
				</div>
			</div>
		)
	}

	return (
		<div className='App'>
			{true ? (
				<div>
					<PokerTable
						onCrownClick={() =>
							navigate('/balance-options', { state: { userId: user.id } })
						}
					/>
				</div>
			) : (
				<div>Loading Telegram user data...</div>
			)}
		</div>
	)
}
export default AppContent
