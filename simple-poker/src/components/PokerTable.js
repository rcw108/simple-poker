import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { TelegramUser } from '../ui/telegramUser/TelegramUser';
import './PokerTable.css';
import { usePokerTable } from './usePokerTable';
import { useTelegram } from './useTelegram';

const PokerTable = () => {
  const [bank, setBank] = useState(null); // Changed initial state to null

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
	  } = useTelegram(setBank); // The bank is set by the useTelegram hook
	
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
	  } = usePokerTable(telegramUser, bank, setBank);
	
	  useEffect(() => {
		if (telegramUser) {
		  console.log('User logged in:', telegramUser);
		  // Bank will already be fetched by useTelegram hook, no need to refetch
		}
	  }, [telegramUser]);
	
	  // Ensure to display loading state when balance is being fetched
	  if (bank === null) {
		return <div>Loading your balance...</div>;
	  }

	const handleWithdraw = e => {
		e.preventDefault()

		fetch('/api/withdraw', {
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
					const newBalance = bank - parseFloat(withdrawAmount)
					setBank(newBalance)
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

	const [upDown, setUpDown] = useState('')

	return (
		<div className='poker-table'>
			{telegramUser && <TelegramUser telegramUser={telegramUser} />}

			<motion.div
				className='header'
				initial='hidden'
				animate='visible'
				variants={fadeVariants}
				transition={{ duration: 0.5 }}
			>
				<div className='crown-section'>
					<img
						src='/assets/icons8-crown-96 1.png'
						alt='Crown'
						className='crown-icon'
					/>
					<motion.span
						className='chips'
						key={bank}
						initial={{ scale: 1.2, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						{bank - 100 < 0 ? 0 : bank - 100}
					</motion.span>
				</div>
			</motion.div>

			<AnimatePresence mode='wait'>
				{!gameStarted ? (
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
							<AnimatePresence mode='wait'>
								{gameStage !== 'initial' && (
									<div className='computer-cards'>
										{computerCards.map((card, index) => (
											<motion.img
												key={index}
												src={card.image}
												alt={`Computer card ${index}`}
												className='card'
												custom={index}
												initial='initial'
												animate='animate'
												exit='exit'
												variants={cardVariants}
											/>
										))}
									</div>
								)}
							</AnimatePresence>

							<div>
								<AnimatePresence mode='wait'>
									{result && (
										<motion.div
											className='flash-text'
											initial={{ opacity: 0, scale: 0.5 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.5 }}
											transition={{ duration: 0.3 }}
										>
											{result}
										</motion.div>
									)}
								</AnimatePresence>

								<AnimatePresence mode='wait'>
									{gameStage !== 'initial' && gameStage !== 'betting' && (
										<motion.div
											className='win-text'
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -20 }}
											transition={{ duration: 0.3 }}
										>
											WIN {winnings}
										</motion.div>
									)}
								</AnimatePresence>

								<AnimatePresence mode='wait'>
									<div className='table-cards'>
										{tableCards.map((card, index) => (
											<motion.img
												key={index}
												src={card.image}
												alt={`Table card ${index}`}
												className='card'
												custom={index}
												initial='initial'
												animate='animate'
												exit='exit'
												variants={cardVariants}
											/>
										))}
									</div>
								</AnimatePresence>
							</div>

							<div className='user-cards'>
								{userCards.map((card, index) => (
									<motion.img
										key={index}
										src={card.image}
										alt={`User card ${index}`}
										className='card'
										custom={index}
										initial='initial'
										animate='animate'
										variants={cardVariants}
									/>
								))}
							</div>
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
					<div className='bank-icon-container'>
						<img src='/assets/chip.png' alt='Chips' className='bank-icon' />
						<motion.div
							className='bank-value'
							key={bank}
							initial={{ scale: 1.2, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.3 }}
						>
							{bank}
						</motion.div>
					</div>
					<div className='bank-text'>Баланс</div>
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
							>
								<button className='deal-button' onClick={dealInitialCards}>
									Раздать
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
									<div className='bet-text'>Ставка</div>
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
							<div>
								<button className='reveal-button' onClick={revealCards}>
									Вскрыть карты
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
								<div className='bet-text'>Ставка</div>
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
						>
							<button className='new-game-button' onClick={startNewGame}>
								Новая игра
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
							<div>
								<div className='dummy'></div>
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