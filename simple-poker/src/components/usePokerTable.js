import { useState } from 'react'
import { rankMap, ranks, suits } from './poker.data'

export const usePokerTable = (telegramUser, bank, setBank) => {
	// Initialize state variables
	const [bet, setBet] = useState(5)
	const [tableCards, setTableCards] = useState([])
	const [userCards, setUserCards] = useState([])
	const [computerCards, setComputerCards] = useState([])
	const [result, setResult] = useState('')
	const [winnings, setWinnings] = useState(0)

	const [withdrawAmount, setWithdrawAmount] = useState('')
	const [withdrawAddress, setWithdrawAddress] = useState('')

	const allCards = []

	// Build the allCards array
	suits.forEach(suit => {
		ranks.forEach(rankStr => {
			let rank = parseInt(rankStr, 10)
			if (isNaN(rank)) {
				rank = rankMap[rankStr]
			}
			const suitName = {
				h: 'hearts',
				d: 'diamonds',
				c: 'clubs',
				s: 'spades',
			}[suit]

			allCards.push({
				rank,
				suit: suitName,
				image: `/assets/cards/${rankStr}${suit}.png`,
			})
		})
	})

	// Increase the bet
	const increaseBet = () => {
		if (bet < bank) setBet(bet + 5)
	}

	// Decrease the bet
	const decreaseBet = () => {
		if (bet > 5) setBet(bet - 5)
	}

	// Shuffle array of cards
	const shuffleArray = array => {
		const shuffled = [...array]
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
		}
		return shuffled
	}

	// Function to get all combinations of a certain size
	const getCombinations = (array, size) => {
		const results = []

		const helper = (start, combo) => {
			if (combo.length === size) {
				results.push(combo)
				return
			}
			for (let i = start; i < array.length; i++) {
				helper(i + 1, combo.concat(array[i]))
			}
		}

		helper(0, [])
		return results
	}

	// Evaluate hand function
	const evaluateHand = cards => {
		// Sort cards by rank
		const sortedCards = cards.slice().sort((a, b) => a.rank - b.rank)

		// Check for Flush
		const suitsCount = {}
		cards.forEach(card => {
			suitsCount[card.suit] = (suitsCount[card.suit] || 0) + 1
		})
		const flushSuit = Object.keys(suitsCount).find(
			suit => suitsCount[suit] >= 5
		)
		const isFlush = flushSuit !== undefined

		// Check for Straight
		let ranks = [...new Set(sortedCards.map(card => card.rank))]
		let isStraight = false

		// Handle low-Ace straight (A-2-3-4-5)
		if (ranks.includes(14)) {
			ranks.push(1)
		}
		ranks.sort((a, b) => a - b)

		for (let i = 0; i <= ranks.length - 5; i++) {
			if (
				ranks[i] + 1 === ranks[i + 1] &&
				ranks[i] + 2 === ranks[i + 2] &&
				ranks[i] + 3 === ranks[i + 3] &&
				ranks[i] + 4 === ranks[i + 4]
			) {
				isStraight = true
				break
			}
		}

		// Check for Straight Flush and Royal Flush
		let isStraightFlush = false
		let isRoyalFlush = false
		if (isFlush) {
			const flushCards = cards.filter(card => card.suit === flushSuit)
			const flushRanks = [...new Set(flushCards.map(card => card.rank))]
			if (flushRanks.includes(14)) {
				flushRanks.push(1)
			}
			flushRanks.sort((a, b) => a - b)
			for (let i = 0; i <= flushRanks.length - 5; i++) {
				if (
					flushRanks[i] + 1 === flushRanks[i + 1] &&
					flushRanks[i] + 2 === flushRanks[i + 2] &&
					flushRanks[i] + 3 === flushRanks[i + 3] &&
					flushRanks[i] + 4 === flushRanks[i + 4]
				) {
					isStraightFlush = true
					if (
						flushRanks.slice(i, i + 5).includes(14) &&
						flushRanks.slice(i, i + 5).includes(10)
					) {
						isRoyalFlush = true
					}
					break
				}
			}
		}

		// Count card occurrences
		const counts = {}
		cards.forEach(card => {
			counts[card.rank] = (counts[card.rank] || 0) + 1
		})
		const countsValues = Object.values(counts)
		const hasFourOfKind = countsValues.includes(4)
		const hasThreeOfKind = countsValues.includes(3)
		const pairs = countsValues.filter(count => count === 2).length

		// Determine hand rank and fixed winnings
		if (isRoyalFlush) return { hand: 'Royal Flush', winnings: bet * 100 }
		if (isStraightFlush) return { hand: 'Straight Flush', winnings: bet * 20 }
		if (hasFourOfKind) return { hand: 'Four of a Kind', winnings: bet * 10 }
		if (hasThreeOfKind && pairs >= 1)
			return { hand: 'Full House', winnings: bet * 7 }
		if (isFlush) return { hand: 'Flush', winnings: bet * 5 }
		if (isStraight) return { hand: 'Straight', winnings: bet * 2 }
		if (hasThreeOfKind) return { hand: 'Three of a Kind', winnings: bet * 1.5 }
		if (pairs >= 2) return { hand: 'Two Pair', winnings: bet * 1 }
		if (pairs === 1) return { hand: 'One Pair', winnings: bet * 0.5 }
		return { hand: 'High Card', winnings: 0 }
	}

	// Deal cards (on button click)
	const dealCards = () => {
		if (bank < bet) {
			setResult('Insufficient balance. Cannot deal.')
			return
		}

		const shuffledDeck = shuffleArray([...allCards])

		const newUserCards = shuffledDeck.slice(0, 2)
		const newComputerCards = shuffledDeck.slice(2, 4) // Карты для компьютера
		const newTableCards = shuffledDeck.slice(4, 9)

		setUserCards(newUserCards)
		setComputerCards(newComputerCards) // Устанавливаем карты компьютера
		setTableCards(newTableCards)

		const allUserCards = [...newUserCards, ...newTableCards]
		const allComputerCards = [...newComputerCards, ...newTableCards] // Карты для компьютера с общими картами

		// Генерируем все возможные комбинации 5-карт для пользователя и компьютера
		const userCombinations = getCombinations(allUserCards, 5)
		const computerCombinations = getCombinations(allComputerCards, 5)

		// Оценка рук
		let bestUserHand = { winnings: 0 }
		userCombinations.forEach(hand => {
			const evaluation = evaluateHand(hand)
			if (evaluation.winnings > bestUserHand.winnings) {
				bestUserHand = evaluation
			}
		})

		let bestComputerHand = { winnings: 0 }
		computerCombinations.forEach(hand => {
			const evaluation = evaluateHand(hand)
			if (evaluation.winnings > bestComputerHand.winnings) {
				bestComputerHand = evaluation
			}
		})

		// Сравнение рук
		if (bestUserHand.winnings > bestComputerHand.winnings) {
			setResult(`You win with ${bestUserHand.hand}!`)
			setWinnings(bestUserHand.winnings)
		} else if (bestUserHand.winnings < bestComputerHand.winnings) {
			setResult(`Computer wins with ${bestComputerHand.hand}!`)
			setWinnings(0) // Вы проиграли, никаких выигрышей
		} else {
			setResult(`It's a tie with ${bestUserHand.hand}!`)
			setWinnings(bestUserHand.winnings) // Вернуть ставку
		}

		const newBalance = bank - bet + winnings
		setBank(newBalance)

		// Update balance on backend
		// fetch('/api/updateBalance', {
		// 	method: 'POST',
		// 	headers: { 'Content-Type': 'application/json' },
		// 	body: JSON.stringify({
		// 		userId: telegramUser.id,
		// 		balance: newBalance,
		// 	}),
		// })
		// 	.then(res => res.json())
		// 	.then(data => {
		// 		if (!data.success) {
		// 			console.error('Error updating balance:', data.message)
		// 		}
		// 	})
		// 	.catch(error => {
		// 		console.error('Error updating balance:', error)
		// 	})
	}

	// Handle withdrawal
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

	return {
		bank,
		setBank,
		bet,
		setBet,
		tableCards,
		setTableCards,
		userCards,
		setUserCards,
		result,
		setResult,
		winnings,
		setWinnings,
		increaseBet,
		decreaseBet,
		shuffleArray,
		getCombinations,
		evaluateHand,
		dealCards,
		handleWithdraw,
		computerCards,
	}
}
