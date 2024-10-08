import { useEffect, useState } from 'react'

export const useTelegram = setBank => {
	// Initialize Telegram Web App
	const [telegramUser, setTelegramUser] = useState(null)
	// State variables for deposit and withdrawal
	const [depositAddress, setDepositAddress] = useState('')
	const [depositComment, setDepositComment] = useState('')

	// Initialize Telegram Web App
	useEffect(() => {
		const initTelegram = () => {
			const tg = window.Telegram.WebApp
			const initData = tg.initData

			// Verify user with backend
			fetch('/api/verifyUser', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ initData }),
			})
				.then(res => res.json())
				.then(data => {
					if (data.success) {
						setTelegramUser(data.user)

						// Fetch user balance
						fetch(`/api/getBalance?userId=${data.user.id}`)
							.then(res => res.json())
							.then(balanceData => {
								if (balanceData.success) {
									setBank(balanceData.balance)
								} else {
									console.error('Error fetching balance:', balanceData.message)
								}
							})
							.catch(error => {
								console.error('Error fetching balance:', error)
							})

						// Fetch deposit address and comment
						fetch(`/api/getDepositAddress?userId=${data.user.id}`)
							.then(res => res.json())
							.then(depositData => {
								if (depositData.success) {
									setDepositAddress(depositData.address)
									setDepositComment(depositData.comment)
								} else {
									console.error(
										'Error fetching deposit address:',
										depositData.message
									)
								}
							})
							.catch(error => {
								console.error('Error fetching deposit address:', error)
							})
					} else {
						alert('Failed to verify Telegram user.')
					}
				})
				.catch(error => {
					console.error('Error verifying user:', error)
				})
		}

		if (window.Telegram && window.Telegram.WebApp) {
			initTelegram()
		} else {
			const script = document.createElement('script')
			script.src = 'https://telegram.org/js/telegram-web-app.js'
			script.onload = initTelegram
			document.body.appendChild(script)
		}
	}, [])

	return {
		telegramUser,
		depositAddress,
		setDepositAddress,
		depositComment,
		setDepositComment,
	}
}
