import { useState } from 'react'
import {
	getFlush,
	getFourOfAKind,
	getFullHouse,
	getPair,
	getStraight,
	getThreeOfAKind,
	getTwoPair,
} from './combinations'
import { rankMap, ranks, suits } from './poker.data'

export const usePokerTable = (telegramUser, bank, setBank) => {
	const [showConfetti, setShowConfetti] = useState(false)
	const [gameStarted, setGameStarted] = useState(false)
	const [bet, setBet] = useState(5)
	const [tableCards, setTableCards] = useState([])
	const [userCards, setUserCards] = useState([])
	const [computerCards, setComputerCards] = useState([])
	const [result, setResult] = useState('')
	const [winnings, setWinnings] = useState(0)
	const [gameStage, setGameStage] = useState('initial') // 'initial', 'betting', 'reveal'

	let allCards = []

	const [newAllCards, setNewAllCards] = useState([])

	const emptyCard = {
		rank: 'unknown',
		suit: 'Empty',
		image: '/assets/cards/empty.png',
		combination: false,
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
				emptyCard: '/assets/cards/empty.png',
				image: `/assets/cards/${rankStr}${suit}.png`,
				combination: false,
			})
		})
	})

	console.log('start game', allCards)

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

	const evaluateHand = (cards, playerHandCards = []) => {
		// Sort cards by rank
		const sortedCards = cards.slice().sort((a, b) => b.rank - a.rank)

		// Add playerHandCards to the evaluation to use in tiebreaks
		const handEvaluation = {
			playerHandCards, // Сохраняем карты в руке для сравнения при ничьей
			sortedCards,
		}

		// Check for each combination and get the specific cards involved
		const fourOfKindCards = getFourOfAKind(cards)
		const fullHouseCards = getFullHouse(cards)
		const flushCards = getFlush(cards)
		const straightCards = getStraight(cards)
		const threeOfKindCards = getThreeOfAKind(cards)
		const twoPairCards = getTwoPair(cards)
		const pairCards = getPair(cards)

		const highestHandCard = playerHandCards.length
			? playerHandCards.reduce((highest, current) =>
					current.rank > highest.rank ? current : highest
			  )
			: null

		// Check for Straight Flush and Royal Flush
		const isRoyalFlush =
			flushCards.length === 5 &&
			straightCards.length === 5 &&
			flushCards.every(card => straightCards.includes(card)) &&
			flushCards[0].rank === 14

		const isStraightFlush =
			flushCards.length === 5 &&
			straightCards.length === 5 &&
			flushCards.every(card => straightCards.includes(card))

		// Determine hand rank and corresponding cards
		switch (true) {
			case isRoyalFlush:
				return {
					...handEvaluation,
					hand: 'Royal Flush',
					winnings: bet * 100,
					combination: flushCards,
					highestHandCard,
				}
			case isStraightFlush:
				return {
					...handEvaluation,
					hand: 'Straight Flush',
					winnings: bet * 20,
					combination: flushCards,
					highestHandCard,
				}
			case fourOfKindCards.length === 4:
				return {
					...handEvaluation,
					hand: 'Four of a Kind',
					winnings: bet * 10,
					combination: fourOfKindCards,
					highestHandCard,
				}
			case fullHouseCards.length === 5:
				return {
					...handEvaluation,
					hand: 'Full House',
					winnings: bet * 7,
					combination: fullHouseCards,
					highestHandCard,
				}
			case flushCards.length === 5:
				return {
					...handEvaluation,
					hand: 'Flush',
					winnings: bet * 5,
					combination: flushCards,
					highestHandCard,
				}
			case straightCards.length === 5:
				return {
					...handEvaluation,
					hand: 'Straight',
					winnings: bet * 2,
					combination: straightCards,
					highestHandCard,
				}
			case threeOfKindCards.length === 3:
				return {
					...handEvaluation,
					hand: 'Three of a Kind',
					winnings: bet * 1.5,
					combination: threeOfKindCards,
					highestHandCard,
				}
			case twoPairCards.length === 4:
				return {
					...handEvaluation,
					hand: 'Two Pair',
					winnings: bet * 1,
					combination: twoPairCards,
					highestHandCard,
				}
			case pairCards.length === 2:
				return {
					...handEvaluation,
					hand: 'One Pair',
					winnings: bet * 0.5,
					combination: pairCards,
					highestHandCard,
				}
			default:
				return {
					...handEvaluation,
					hand: 'High Card',
					winnings: 0,
					combination: [sortedCards[0]],
					highestHandCard: sortedCards[0],
				}
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
		setNewAllCards([...shuffledDeck.slice(2)])
		console.log('newAllCards', newAllCards)
		setUserCards(newUserCards)
		setComputerCards([emptyCard, emptyCard])
		setTableCards([emptyCard, emptyCard, emptyCard, emptyCard, emptyCard])
		setResult('')
		setWinnings(0)
	}

	const compareHighCards = (hand1, hand2) => {
		// Ensure valid inputs
		const playerHandCards1 = hand1?.playerHandCards || []
		const playerHandCards2 = hand2?.playerHandCards || []

		// If no cards to compare, declare a tie
		if (!playerHandCards1.length || !playerHandCards2.length) {
			return { winner: 'tie', card: null }
		}

		// Sort both hands by rank in descending order
		const sortedHand1 = [...playerHandCards1].sort((a, b) => b.rank - a.rank)
		const sortedHand2 = [...playerHandCards2].sort((a, b) => b.rank - a.rank)

		// Compare highest cards, then second highest, and so on
		for (let i = 0; i < Math.min(sortedHand1.length, sortedHand2.length); i++) {
			if (sortedHand1[i].rank > sortedHand2[i].rank) {
				return {
					winner: 'user',
					card: sortedHand1[i],
				}
			} else if (sortedHand2[i].rank > sortedHand1[i].rank) {
				return {
					winner: 'trinity',
					card: sortedHand2[i],
				}
			}
		}

		// If all cards are equal, it's a tie
		return {
			winner: 'tie',
			card: sortedHand1[0],
		}
	}

	const revealCards = () => {
		setGameStage('reveal')
		console.log('all cards', newAllCards)
		const newUserCards = [...userCards]
		const newComputerCards = newAllCards.slice(2, 4)
		const newTableCards = newAllCards.slice(4, 9)

		setComputerCards(newComputerCards)
		setTableCards(newTableCards)

		const allUserCards = [...newUserCards, ...newTableCards]
		const allComputerCards = [...newComputerCards, ...newTableCards]

		const userCombinations = getCombinations(allUserCards, 5)
		const computerCombinations = getCombinations(allComputerCards, 5)

		let bestUserHand = { winnings: 0, combination: [], hand: '' }
		userCombinations.forEach(hand => {
			const evaluation = evaluateHand(hand, newUserCards)
			if (evaluation.winnings > bestUserHand.winnings) {
				bestUserHand = evaluation
			}
		})

		let bestComputerHand = { winnings: 0, combination: [], hand: '' }
		computerCombinations.forEach(hand => {
			const evaluation = evaluateHand(hand, newComputerCards)
			if (evaluation.winnings > bestComputerHand.winnings) {
				bestComputerHand = evaluation
			}
		})

		let winningCombination = []
		let newWinnings = 0

		if (bestUserHand.winnings === bestComputerHand.winnings) {
			const comparison = compareHighCards(bestUserHand, bestComputerHand)

			switch (comparison.winner) {
				case 'user':
					setResult(
						`You win with ${bestUserHand.hand} (High Card: ${comparison.card.rank})`
					)
					newWinnings = bestUserHand.winnings
					winningCombination = bestUserHand.combination
					break
				case 'trinity':
					setResult(
						`Trinity wins with ${bestComputerHand.hand} (High Card: ${comparison.card.rank})`
					)
					newWinnings = 0
					winningCombination = bestComputerHand.combination
					break
				case 'tie':
					setResult(`It's a tie with ${bestUserHand.hand}!`)
					newWinnings = bet
					winningCombination = bestUserHand.combination
					break
				default:
					break
			}
		}

		if (bestUserHand.winnings > bestComputerHand.winnings) {
			setResult(`You win with ${bestUserHand.hand}!`)
			newWinnings = bestUserHand.winnings
			winningCombination = bestUserHand.combination
		} else if (bestUserHand.winnings < bestComputerHand.winnings) {
			setResult(`Trinity wins with ${bestComputerHand.hand}!`)
			newWinnings = 0
			winningCombination = bestComputerHand.combination
		} else {
			// Tie - compare cards in hand
			const comparison = compareHighCards(bestUserHand, bestComputerHand)

			switch (comparison.winner) {
				case 'user':
					setResult(`You win with ${bestUserHand.hand}`)
					newWinnings = bestUserHand.winnings
					// Important: Use the full winning combination, not just the high card
					winningCombination = bestUserHand.combination
					break
				case 'trinity':
					setResult(`Trinity wins with ${bestComputerHand.hand}`)
					newWinnings = 0
					// Important: Use the full winning combination, not just the high card
					winningCombination = bestComputerHand.combination
					break
				case 'tie':
					setResult(`It's a tie with ${bestUserHand.hand}!`)
					newWinnings = bet
					winningCombination = bestUserHand.combination
					break
				default:
					break
			}
		}

		const updateCombinationFlag = (cards, winningCombination) => {
			return cards.map(card => ({
				...card,
				combination: winningCombination.some(
					winCard => winCard.rank === card.rank && winCard.suit === card.suit
				),
			}))
		}

		setUserCards(updateCombinationFlag(newUserCards, winningCombination))
		setComputerCards(
			updateCombinationFlag(newComputerCards, winningCombination)
		)
		setTableCards(updateCombinationFlag(newTableCards, winningCombination))

		setWinnings(newWinnings)
		setBank(prevBank => prevBank - bet + newWinnings)
	}

	const startNewGame = () => {
		setShowConfetti(true)
		setGameStage('betting')
		setGameStarted(false)
		setUserCards([])
		setComputerCards([])
		setTableCards([])
		setResult('')
		setWinnings(0)
		setBet(5)
		setTimeout(() => {
			/* `setShowConfetti(false)` is a function call that updates the state variable `showConfetti` to
			`false`. This means that it will hide or stop the confetti animation on the poker table interface
			by setting the `showConfetti` state to `false`. */
			// setShowConfetti(false)
			dealInitialCards()
		}, 500)
	}

	// const startNewGame = () => {
	// 	setGameStage('initial')
	// 	setGameStarted(false)
	// 	setUserCards([])
	// 	setComputerCards([])
	// 	setTableCards([])
	// 	setResult('')
	// 	setWinnings(0)
	// 	setBet(5)
	// }

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
		showConfetti,
		setShowConfetti,
	}
}
