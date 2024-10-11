import React, { useState } from 'react'
import { TelegramUser } from '../ui/telegramUser/TelegramUser'
import './PokerTable.css'
import { usePokerTable } from './usePokerTable'
import { useTelegram } from './useTelegram'

const PokerTable = () => {
	const [bank, setBank] = useState(100)

	const {
		telegramUser,
		depositAddress,
		depositComment,
		withdrawAmount,
		setWithdrawAmount,
		withdrawAddress,
		setWithdrawAddress,
	} = useTelegram(setBank)

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
	} = usePokerTable(telegramUser, bank, setBank)

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

			<div className='header'>
				<div className='crown-section'>
					<img
						src='/assets/icons8-crown-96 1.png'
						alt='Crown'
						className='crown-icon'
					/>
					<span className='chips'>{bank - 100 < 0 ? 0 : bank - 100}</span>
				</div>
			</div>

			{!gameStarted ? (
				<div className='logo-screen-container'>
					<div className='logo-screen'>
						<img src='/assets/first-logo.png' alt='logo' />
					</div>
				</div>
			) : (
				<>
					<div className='cards-section'>
						{gameStage !== 'initial' && (
							<div className='computer-cards'>
								{computerCards.map((card, index) => (
									<img
										key={index}
										src={card.image}
										alt={`Computer card ${index}`}
										className='card'
									/>
								))}
							</div>
						)}

						<div className='table-cards'>
							{tableCards.map((card, index) => (
								<img
									key={index}
									src={card.image}
									alt={`Table card ${index}`}
									className='card'
								/>
							))}
						</div>

						<div className='user-cards'>
							{userCards.map((card, index) => (
								<img
									key={index}
									src={card.image}
									alt={`User card ${index}`}
									className='card'
								/>
							))}
						</div>

						<div className='flash-text'>{result}</div>
						{gameStage !== 'initial' && gameStage !== 'betting' && (
							<div className='win-text'>WIN {winnings}</div>
						)}
					</div>
				</>
			)}

			<div className='controls'>
				<div className='bank'>
					<div className='bank-icon-container'>
						<img src='/assets/chip.png' alt='Chips' className='bank-icon' />
						<div className='bank-value'>{bank}</div>
					</div>
					<div className='bank-text'>Банк</div>
				</div>

				{gameStage === 'initial' && (
					<>
						<button className='deal-button' onClick={dealInitialCards}>
							Раздать
						</button>
						<div className='bet'>
							<div className='bet-icon-container'>
								<img
									src='/assets/PokerChip2.png'
									alt='Bet'
									className='bet-icon'
								/>
								<div className='bet-value'>{bet}</div>
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
					</>
				)}

				{gameStage === 'betting' && (
					<>
						<div>
							<button className='reveal-button' onClick={revealCards}>
								Вскрыть карты
							</button>
							<div className='up-down' style={{ backgroundColor: upDown }}>
								<span
									className='down'
									onClick={decreaseBet}
									onMouseLeave={e => setUpDown('')}
									onMouseEnter={e => setUpDown('rgb(215, 50, 50)')}
								>
									<span className='icon-minus'>
										<span>-</span>
									</span>
								</span>
								<span className='up-down-text'>Поднять</span>
								<span
									className='up'
									onClick={increaseBet}
									onMouseLeave={e => setUpDown('')}
									onMouseEnter={e => setUpDown('#1FEB95')}
								>
									<span className='icon-plus'>
										<span>+</span>
									</span>
								</span>
							</div>
						</div>
						<div className='bet'>
							<div className='bet-icon-container'>
								<img
									src='/assets/PokerChip2.png'
									alt='Bet'
									className='bet-icon'
								/>
								<div className='bet-value'>{bet}</div>
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
					</>
				)}

				{gameStage === 'reveal' && (
					<>
						<button className='new-game-button' onClick={startNewGame}>
							Новая игра
						</button>
						<div>
							<div className='dummy'></div>
						</div>
					</>
				)}
			</div>

			<div className='deposit-section'>
				<h3>Deposit TON Coins</h3>
				<p>Send TON coins to the following address:</p>
				<code>{depositAddress}</code>
				<p>Include this comment in your transaction:</p>
				<code>{depositComment}</code>
			</div>

			<div className='withdrawal-section'>
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
			</div>
		</div>
	)
}

export default PokerTable
