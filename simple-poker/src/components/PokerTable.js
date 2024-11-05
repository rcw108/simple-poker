import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom' // Import useNavigate
import { useBalance } from '../providers/BalanceProvider'
import Card from '../ui/card/Card'
import { TelegramUser } from '../ui/telegramUser/TelegramUser'
import './PokerTable.css'
import { usePokerTable } from './usePokerTable'
import { useTelegram } from './useTelegram'

const PokerTable = () => {
	const { balance, setBalance } = useBalance()
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
	} = usePokerTable(telegramUser, balance, setBalance)

	useEffect(() => {
		if (telegramUser) {
			console.log('User logged in:', telegramUser)
			// Bank will already be fetched by useTelegram hook, no need to refetch
		}
	}, [telegramUser])

	useEffect(() => {
		if (gameStage === 'betting') {
			handleDisabled(1800)
		}
		if (gameStage === 'reveal') {
			handleDisabled(1800)
		}
	}, [gameStage])

	// Ensure to display loading state when balance is being fetched
	if (balance === null) {
		return <div>Loading your balance...</div>
	}

	const handleGameResult = winnings => {
		// Adjust the in-game balance based on winnings or losses
		const newBalance = balance + winnings // winnings can be positive or negative depending on win/loss
		setBalance(newBalance)

		// Send a request to the backend to update the user's balance in the database
		fetch('https://game-baboon-included.ngrok-free.app/api/updateBalance', {
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

	const handleWithdraw = e => {
		e.preventDefault()

		fetch('https://game-baboon-included.ngrok-free.app/api/withdraw', {
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
			{telegramUser && <TelegramUser telegramUser={telegramUser} />}
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
										>
											{`${textResult} ${
												textResult === 'You lose' ? '' : winnings
											}`}
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
						<img
							src='/assets/PokerChip2.png'
							alt='Chips'
							className='bank-icon'
						/>
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
						<span>+</span>
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
										<button onClick={allIn}>All-in</button>
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
										<button className='bet-minus' onClick={decreaseBet}>
											-
										</button>
										<button className='bet-plus' onClick={increaseBet}>
											+
										</button>
									</div>
								</div>
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
						<motion.div
							key='betting-controls-2'
							initial='hidden'
							animate='visible'
							exit='exit'
							variants={fadeVariants}
							transition={{ duration: 0.3 }}
						>
							<div className='bet'>
								<div className='all-in'>
									<button onClick={allIn}>All-in</button>
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
									<button className='bet-minus' onClick={decreaseBet}>
										-
									</button>
									<button className='bet-plus' onClick={increaseBet}>
										+
									</button>
								</div>
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
						<motion.div
							key='reveal-controls-2'
							initial='hidden'
							animate='visible'
							exit='exit'
							variants={fadeVariants}
							transition={{ duration: 0.3 }}
						>
							<div className='bet'>
								<div className='all-in'>
									<button onClick={allIn}>All-in</button>
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
									<button className='bet-minus' onClick={decreaseBet}>
										-
									</button>
									<button className='bet-plus' onClick={increaseBet}>
										+
									</button>
								</div>
							</div>
						</motion.div>
					</AnimatePresence>
				)}
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
