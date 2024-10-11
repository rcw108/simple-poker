import { useState } from 'react'
import { rankMap, ranks, suits } from './poker.data'

export const usePokerTable = (telegramUser, bank, setBank) => {
	const [gameStarted, setGameStarted] = useState(false)
	const [bet, setBet] = useState(5)
	const [tableCards, setTableCards] = useState([])
	const [userCards, setUserCards] = useState([])
	const [computerCards, setComputerCards] = useState([])
	const [result, setResult] = useState('')
	const [winnings, setWinnings] = useState(0)
	const [gameStage, setGameStage] = useState('initial') // 'initial', 'betting', 'reveal'

	const [withdrawAmount, setWithdrawAmount] = useState('')
	const [withdrawAddress, setWithdrawAddress] = useState('')

	const allCards = []

	const emptyCard = {
		rank: 'unknown',
		suit: 'Empty',
		image: '/assets/cards/empty.png',
	}

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

	const increaseBet = () => {
		if (bet < bank) setBet(bet + 5)
	}

	const decreaseBet = () => {
		if (bet > 5) setBet(bet - 5)
	}

	const shuffleArray = array => {
		const shuffled = [...array]
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
		}
		return shuffled
	}

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

	const evaluateHand = cards => {
		// Sort cards by rank
		const sortedCards = cards.slice().sort((a, b) => b.rank - a.rank)

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
			ranks.unshift(1)
		}

		for (let i = 0; i <= ranks.length - 5; i++) {
			if (
				ranks[i] - 1 === ranks[i + 1] &&
				ranks[i] - 2 === ranks[i + 2] &&
				ranks[i] - 3 === ranks[i + 3] &&
				ranks[i] - 4 === ranks[i + 4]
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
				flushRanks.unshift(1)
			}
			flushRanks.sort((a, b) => b - a)
			for (let i = 0; i <= flushRanks.length - 5; i++) {
				if (
					flushRanks[i] - 1 === flushRanks[i + 1] &&
					flushRanks[i] - 2 === flushRanks[i + 2] &&
					flushRanks[i] - 3 === flushRanks[i + 3] &&
					flushRanks[i] - 4 === flushRanks[i + 4]
				) {
					isStraightFlush = true
					if (flushRanks[i] === 14) {
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
		switch (true) {
			case isRoyalFlush:
				return { hand: 'Royal Flush', winnings: bet * 100 }
			case isStraightFlush:
				return { hand: 'Straight Flush', winnings: bet * 20 }
			case hasFourOfKind:
				return { hand: 'Four of a Kind', winnings: bet * 10 }
			case hasThreeOfKind && pairs >= 1:
				return { hand: 'Full House', winnings: bet * 7 }
			case isFlush:
				return { hand: 'Flush', winnings: bet * 5 }
			case isStraight:
				return { hand: 'Straight', winnings: bet * 2 }
			case hasThreeOfKind:
				return { hand: 'Three of a Kind', winnings: bet * 1.5 }
			case pairs >= 2:
				return { hand: 'Two Pair', winnings: bet * 1 }
			case pairs === 1:
				return { hand: 'One Pair', winnings: bet * 0.5 }
			default:
				return { hand: 'High Card', winnings: 0 }
		}
	}

	const dealInitialCards = () => {
		setGameStarted(true)
		setGameStage('betting')
		if (bank < bet) {
			setResult('Insufficient balance. Cannot deal.')
			return
		}

		const shuffledDeck = shuffleArray([...allCards])
		const newUserCards = shuffledDeck.slice(0, 2)
		setUserCards(newUserCards)
		setComputerCards([emptyCard, emptyCard])
		setTableCards([emptyCard, emptyCard, emptyCard, emptyCard, emptyCard])
		setResult('')
		setWinnings(0)
	}

	const revealCards = () => {
		setGameStage('reveal')
		const shuffledDeck = shuffleArray([...allCards])
		const newComputerCards = shuffledDeck.slice(2, 4)
		const newTableCards = shuffledDeck.slice(4, 9)

		setComputerCards(newComputerCards)
		setTableCards(newTableCards)

		const allUserCards = [...userCards, ...newTableCards]
		const allComputerCards = [...newComputerCards, ...newTableCards]

		const userCombinations = getCombinations(allUserCards, 5)
		const computerCombinations = getCombinations(allComputerCards, 5)

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

		let newWinnings = 0
		if (bestUserHand.winnings > bestComputerHand.winnings) {
			setResult(`You win with  ${bestUserHand.hand}!`)
			newWinnings = bestUserHand.winnings
		} else if (bestUserHand.winnings < bestComputerHand.winnings) {
			setResult(`Trinity wins with ${bestComputerHand.hand}!`)
			newWinnings = 0
		} else {
			setResult(
				`It's a tie with ${
					bestUserHand.hand === undefined ? 'High Card' : bestUserHand.hand
				}!`
			)
			newWinnings = bet
		}

		setWinnings(newWinnings)
		setBank(prevBank => {
			const newBalance = prevBank - bet + newWinnings
			console.log(
				`Предыдущий баланс: ${prevBank}`,
				`Ставка: ${bet}`,
				`Выигрыш: ${newWinnings}`,
				`Новый баланс: ${newBalance}`
			)
			return newBalance
		})
	}

	const startNewGame = () => {
		setGameStage('initial')
		setGameStarted(false)
		setUserCards([])
		setComputerCards([])
		setTableCards([])
		setResult('')
		setWinnings(0)
		setBet(5)
	}

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
	}
}
