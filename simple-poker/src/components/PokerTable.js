import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom' // Import useNavigate
import { useBalance } from '../providers/BalanceProvider'
import Card from '../ui/card/Card'
import SvgConfetti from '../ui/confetti/SvgConfetti'
import { TelegramUser } from '../ui/telegramUser/TelegramUser'
import './PokerTable.css'
import { usePokerTable } from './usePokerTable'
import { useTelegram } from './useTelegram'
import { API_BASE_URL } from '../config'

const PokerTable = () => {
	const { balance, setBalance, setSound, sound } = useBalance()
	const [bank, setBank] = useState(balance)

	// Initialize navigate inside the component
	const navigate = useNavigate()

	const onCrownClick = () => {
		// Navigate to the balance options page
		navigate('/balance-options')
	}

	// Flip card
	const [isFlipped, setIsFlipped] = useState(false)
	const [isAnimating, setIsAnimating] = useState(false)
	const [disabled, setDisabled] = useState(false)

	const handleDisabled = time => {
		setDisabled(true)
		setTimeout(() => {
			setDisabled(false)
		}, time)
	}

	const handleFlip = () => {
		if (!isAnimating) {
			setIsFlipped(!isFlipped)
			setIsAnimating(true)
		}
	}

	const cardVariants = {
		initial: {
			opacity: 0,
			y: '-100vh',
			left: '50%',
			rotate: 0,
			scale: 0.5,
		},
		animate: index => ({
			opacity: 1,
			y: 0,
			rotate: 360,
			scale: 1,
			transition: {
				duration: 0.8,
				delay: index * 0.1,
				ease: 'easeInOut',
			},
			exit: {
				opacity: 1,
				rotateX: 180,
				scale: 1,
				transition: { duration: 0.6 },
			},
		}),
	}

	const fadeVariants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1 },
		exit: { opacity: 0 },
	}

	const {
		telegramUser,
		depositAddress,
		depositComment,
		withdrawAmount,
		setWithdrawAmount,
		withdrawAddress,
		setWithdrawAddress,
		balanceError,
	} = useTelegram(setBalance) // The bank is set by the useTelegram hook

	const {
		bet,
		tableCards,
		userCards,
		computerCards,
		result,
		winnings,
		increaseBet,
		decreaseBet,
		dealInitialCards,
		revealCards,
		startNewGame,
		gameStarted,
		gameStage,
		showConfetti,
		textResult,
		allIn,
		skip,
		chipBank,
	} = usePokerTable(telegramUser, balance, setBalance)

	useEffect(() => {
		if (telegramUser) {
			console.log('User logged in:', telegramUser)
			// Bank will already be fetched by useTelegram hook, no need to refetch
		}
	}, [telegramUser])

	const [syncError, setSyncError] = useState(null)

	// Periodically sync balance with backend to catch deposits and other updates
	useEffect(() => {
		if (!telegramUser || !telegramUser.id) return

		const syncBalance = () => {
			fetch(`${API_BASE_URL}/api/getBalance?userId=${telegramUser.id}`, {
				headers: {
					'ngrok-skip-browser-warning': 'true',
				},
			})
				.then(async (res) => {
					// Check if response is JSON
					const contentType = res.headers.get('content-type');
					if (!contentType || !contentType.includes('application/json')) {
						const text = await res.text();
						throw new Error(`Expected JSON but got ${contentType}. This might be an ngrok warning page.`);
					}
					return res.json();
				})
				.then((data) => {
					if (data.success) {
						setBalance(prevBalance => {
							if (prevBalance !== data.balance) {
								console.log('Balance synced from backend:', data.balance, 'Previous:', prevBalance)
								return data.balance
							}
							return prevBalance
						})
						setSyncError(null) // Clear error on success
					} else {
						setSyncError(data.message || 'Failed to sync balance')
					}
				})
				.catch((error) => {
					const errorMsg = error.message || 'Network error syncing balance'
					console.error('Error syncing balance:', error)
					setSyncError(errorMsg)
				})
		}

		// Sync immediately and then every 10 seconds
		syncBalance()
		const interval = setInterval(syncBalance, 10000)

		return () => clearInterval(interval)
	}, [telegramUser?.id])

	const bankRef = useRef(null)

	const handlePlayBalanceSound = () => {
		if (sound) {
			const audio = new Audio('/assets/sound/money.mp3')
			audio.play()
		}
	}

	useEffect(() => {
		if (gameStage === 'betting') {
			handleDisabled(1800)
		}
		if (gameStage === 'reveal') {
			handleDisabled(1800)
		}
	}, [gameStage])

	useEffect(() => {
		if (bankRef.current) {
			console.log('bankRef is set:', bankRef.current)
		}
	}, [bankRef.current])

	useEffect(() => {
		if (chipBank) {
			handlePlayBalanceSound()
		}
	}, [chipBank])

	// Ensure to display loading state when balance is being fetched
	if (balance === null) {
		return <div>Loading your balance...</div>
	}

	// Display errors if any
	const hasErrors = balanceError || syncError

	const handleGameResult = winnings => {
		// Adjust the in-game balance based on winnings or losses
		const newBalance = balance + winnings // winnings can be positive or negative depending on win/loss
		setBalance(newBalance)

		// Send a request to the backend to update the user's balance in the database
		fetch(`${API_BASE_URL}/api/updateBalance`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				userId: telegramUser.id,
				balance: newBalance,
			}),
		})
			.then(res => res.json())
			.then(data => {
				if (data.success) {
					console.log('Balance successfully updated in the backend.')
				} else {
					console.error(`Error updating balance: ${data.message}`)
				}
			})
			.catch(error => {
				console.error('Error updating balance:', error)
			})
	}

	const handlePlayAudio = e => {
		if (sound) {
			const audio = new Audio('/assets/sound/pokerchip08.mp3')
			audio.play()
		}
	}

	const handleWithdraw = e => {
		e.preventDefault()

		fetch(`${API_BASE_URL}/api/withdraw`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId: telegramUser.id,
				amount: withdrawAmount,
				toAddress: withdrawAddress,
			}),
		})
			.then(res => res.json())
			.then(data => {
				if (data.success) {
					alert('Withdrawal processed!')
					// Update balance on frontend
					const newBalance = balance - parseFloat(withdrawAmount)
					setBalance(newBalance)
					setWithdrawAmount('')
					setWithdrawAddress('')
				} else {
					alert(`Error: ${data.message}`)
				}
			})
			.catch(error => {
				console.error('Error processing withdrawal:', error)
			})
	}

	return (
		<div className='poker-table'>
			{hasErrors && (
				<div style={{
					position: 'fixed',
					top: '10px',
					left: '50%',
					transform: 'translateX(-50%)',
					zIndex: 10000,
					backgroundColor: '#e74c3c',
					color: '#fff',
					padding: '12px 20px',
					borderRadius: '8px',
					fontSize: '14px',
					maxWidth: '90%',
					boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
					textAlign: 'center'
				}}>
					<div style={{ fontWeight: 'bold', marginBottom: '5px' }}>⚠️ Error</div>
					{balanceError && <div style={{ marginBottom: '5px' }}>Balance: {balanceError}</div>}
					{syncError && <div>Sync: {syncError}</div>}
				</div>
			)}
			{telegramUser && <TelegramUser telegramUser={telegramUser} />}
			<div className='sound' onClick={() => setSound(!sound)}>
				{sound ? (
					<img src='/assets/sound/sound-on.svg' alt='sound' />
				) : (
					<img src='/assets/sound/sound-off.svg' alt='sound' />
				)}
			</div>
			<AnimatePresence mode='wait'>
				{!gameStarted ? (
					skip ? (
						<motion.div
							className='logo-screen-container'
							key='logo-screen'
							initial='hidden'
							animate='visible'
							exit='exit'
							variants={fadeVariants}
							transition={{ duration: 0.5 }}
						></motion.div>
					) : (
						<motion.div
							className='logo-screen-container'
							key='logo-screen'
							initial='hidden'
							animate='visible'
							exit='exit'
							variants={fadeVariants}
							transition={{ duration: 0.5 }}
						>
							<div className='logo-screen'>
								<motion.img src='/assets/first-logo.png' alt='logo' />
							</div>
						</motion.div>
					)
				) : (
					<motion.div
						key='game-screen'
						initial='hidden'
						animate='visible'
						exit='exit'
						variants={fadeVariants}
						transition={{ duration: 0.5 }}
						className='cards-wrap'
					>
						<div className='cards-section'>
							<h4 style={{ position: 'absolute', content: '', top: '-20px' }}>
								Trinity hand
							</h4>
							<AnimatePresence mode='wait'>
								{gameStage !== 'initial' && (
									<div className='computer-cards'>
										{computerCards.map((card, index) => (
											<Card
												key={index}
												index={index}
												stage={gameStage}
												image={card.image}
												combination={card.combination}
												flippedStage='reveal'
											/>
										))}
									</div>
								)}
							</AnimatePresence>

							<div>
								<AnimatePresence mode='wait'>
									{result && (
										<>
											<motion.div
												className='flash-text'
												initial={{ opacity: 0, y: 20, scale: 0.55 }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												transition={{ duration: 0.8, delay: 1 }}
											>
												<div>{result}</div>
											</motion.div>
											{/* {result === 'win'
												? handleGameResult(winnings)
												: handleGameResult(-bet)} */}
										</>
									)}
								</AnimatePresence>

								<AnimatePresence mode='wait'>
									<div className='table-cards'>
										{tableCards.map((card, index) => (
											<Card
												key={index}
												index={index}
												stage={gameStage}
												image={card.image}
												combination={card.combination}
												flippedStage='reveal'
											/>
										))}
									</div>
								</AnimatePresence>
								<AnimatePresence mode='wait'>
									{gameStage !== 'initial' && gameStage !== 'betting' && (
										<motion.div
											className={`win-text ${winnings === 0 ? 'lose' : ''}`}
											initial={{ opacity: 0, y: 20, scale: 0.55 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											// exit={{ opacity: 0, y: -20, scale: 0.55 }}
											transition={{ duration: 0.8, delay: 1 }}
											ref={bankRef}
										>
											{`${textResult} ${
												textResult === 'You lose' ? '' : winnings
											}`}
											{chipBank && bankRef.current && (
												<SvgConfetti
													wrapperRef={bankRef.current}
													icon={
														textResult === 'You lose'
															? '/assets/lose.svg'
															: '/assets/PokerChip2.png'
													}
												/>
											)}
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							<motion.div
								className={`flip-card-inner ${
									gameStage === 'betting' ? 'flipped' : ''
								} user-cards`}
							>
								{userCards.map((card, index) => (
									<Card
										key={index}
										image={card.image}
										index={index}
										stage={gameStage}
										combination={card.combination}
										flippedStage='betting'
									/>
								))}
							</motion.div>
							<h4
								style={{ position: 'absolute', content: '', bottom: '-55px' }}
							>
								Your hand
							</h4>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.div
				className='controls'
				initial='hidden'
				animate='visible'
				variants={fadeVariants}
				transition={{ duration: 0.5, delay: 0.2 }}
			>
				<div className='bank'>
					<Link to={'/my-profile'}>
						<div className='crown-section' onClick={onCrownClick}>
							<img
								src='/assets/icons8-crown-96 1.png'
								alt='Crown'
								className='crown-icon'
							/>
							<motion.span
								className='chips'
								key={balance}
								initial={{ scale: 1.2, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ duration: 0.3 }}
							>
								{balance - 100 < 0 ? 0 : balance - 100}
							</motion.span>
						</div>
					</Link>
					<div className='bank-icon-container'>
						<div>
							<img
								src='/assets/PokerChip2.png'
								alt='Chips'
								className='bank-icon'
							/>
						</div>
						<motion.div
							className='bank-value'
							key={balance * 2}
							initial={{ scale: 1.2, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.3 }}
						>
							{balance}
						</motion.div>
					</div>
					<div className='bank-text'>Chips</div>
					<div className='add-balance'>
						<img src='/assets/plus.svg' alt='plus' />
					</div>
				</div>

				{gameStage === 'initial' && (
					<>
						<AnimatePresence mode='wait'>
							<motion.div
								key='initial-controls'
								initial='hidden'
								animate='visible'
								exit='exit'
								variants={fadeVariants}
								transition={{ duration: 0.3 }}
								className='btns-section'
							>
								<button className='deal-button' onClick={dealInitialCards}>
									Start Game
								</button>
							</motion.div>
						</AnimatePresence>
					</>
				)}

				{gameStage === 'betting' && (
					<>
						<motion.div
							key='betting-controls'
							initial='hidden'
							animate='visible'
							exit='exit'
							variants={fadeVariants}
							transition={{ duration: 0.3 }}
						>
							<div className='btns-section'>
								<button
									className='reveal-button'
									onClick={revealCards}
									disabled={disabled}
								>
									Showdown
								</button>
							</div>
						</motion.div>
					</>
				)}

				{gameStage === 'reveal' && (
					<AnimatePresence mode='wait'>
						<motion.div
							key='reveal-controls'
							initial='hidden'
							animate='visible'
							exit='exit'
							variants={fadeVariants}
							transition={{ duration: 0.3 }}
							className='btns-section'
						>
							<button
								className='new-game-button'
								disabled={disabled}
								onClick={startNewGame}
							>
								New Round
							</button>
						</motion.div>
					</AnimatePresence>
				)}
				<AnimatePresence mode='wait'>
					<motion.div
						key='initial-controls'
						initial='hidden'
						animate='visible'
						exit='exit'
						variants={fadeVariants}
						transition={{ duration: 0.3 }}
					>
						<div className='bet'>
							<div className='all-in'>
								<button
									onClick={e => {
										allIn()
										handlePlayAudio(e)
									}}
								>
									All-in
								</button>
							</div>
							<div className='bet-icon-container'>
								<img
									src='/assets/PokerChip2.png'
									alt='Bet'
									className='bet-icon'
								/>
								<motion.div
									className='bet-value'
									key={bet}
									initial={{ scale: 1.2, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ duration: 0.3 }}
								>
									{bet}
								</motion.div>
							</div>
							<div className='bet-text'>Wager</div>
							<div className='bet-controls'>
								<button
									className='bet-minus'
									onClick={e => {
										decreaseBet()
										handlePlayAudio(e)
									}}
								>
									<img src='/assets/minus.svg' alt='plus' />
								</button>
								<button
									className='bet-plus'
									onClick={e => {
										increaseBet()
										handlePlayAudio(e)
									}}
								>
									<img src='/assets/plus.svg' alt='plus' />
								</button>
							</div>
						</div>
					</motion.div>
				</AnimatePresence>
			</motion.div>

			{/* <motion.div
				className='deposit-section'
				initial='hidden'
				animate='visible'
				variants={fadeVariants}
				transition={{ duration: 0.5, delay: 0.4 }}
			>
				<h3>Deposit TON Coins</h3>
				<p>Send TON coins to the following address:</p>
				<code>{depositAddress}</code>
				<p>Include this comment in your transaction:</p>
				<code>{depositComment}</code>
			</motion.div>

			<motion.div
				className='withdrawal-section'
				initial='hidden'
				animate='visible'
				variants={fadeVariants}
				transition={{ duration: 0.5, delay: 0.6 }}
			>
				<h3>Withdraw Funds</h3>
				<form onSubmit={handleWithdraw}>
					<input
						type='text'
						placeholder='Your TON Wallet Address'
						value={withdrawAddress}
						onChange={e => setWithdrawAddress(e.target.value)}
						required
					/>
					<input
						type='number'
						placeholder='Amount to Withdraw'
						value={withdrawAmount}
						onChange={e => setWithdrawAmount(e.target.value)}
						min='0'
						max={bank}
						required
					/>
					<button type='submit'>Withdraw</button>
				</form>
			</motion.div> */}
		</div>
	)
}

export default PokerTable
