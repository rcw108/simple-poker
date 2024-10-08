// PokerTable.js

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
		result,
		winnings,
		increaseBet,
		decreaseBet,
		dealCards,
		handleWithdraw,
		computerCards,
	} = usePokerTable(telegramUser, bank, setBank)

	return (
		<div className='poker-table'>
			{/* Display Telegram User Info */}
			{telegramUser && <TelegramUser telegramUser={telegramUser} />}

			{/* Header Section */}
			<div className='header'>
				<img
					src='/assets/cardsgroup.png'
					alt='Cards'
					className='cards-header'
				/>
				<div className='crown-section'>
					<img
						src='/assets/icons8-crown-96 1.png'
						alt='Crown'
						className='crown-icon'
					/>
					<span className='chips'>{bank - 100 < 0 ? 0 : bank - 100}</span>
				</div>
			</div>

			{/* Game Section */}
			<div className='cards-section'>
				{/* Show computer cards */}
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

				{/* Show table cards */}
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

				{/* Show user cards */}
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

				{/* Flash text and win result */}
				<div className='flash-text'>{result}</div>
				<div className='win-text'>WIN {winnings}</div>
			</div>

			{/* Controls Section */}
			<div className='controls'>
				<div className='bank'>
					<div className='bank-icon-container'>
						<img
							src='/assets/PokerChips1.png'
							alt='Chips'
							className='bank-icon'
						/>
						<div className='bank-value'>{bank}</div>
					</div>
					<div className='bank-text'>Банк</div>
				</div>

				<button className='deal-button' onClick={dealCards}>
					Раздать
				</button>

				<div className='bet'>
					<div className='bet-icon-container'>
						<img src='/assets/PokerChip2.png' alt='Bet' className='bet-icon' />
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
			</div>

			{/* Deposit Section */}
			<div className='deposit-section'>
				<h3>Deposit TON Coins</h3>
				<p>Send TON coins to the following address:</p>
				<code>{depositAddress}</code>
				<p>Include this comment in your transaction:</p>
				<code>{depositComment}</code>
			</div>

			{/* Withdrawal Section */}
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
