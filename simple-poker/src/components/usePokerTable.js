import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBalance } from '../providers/BalanceProvider'
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

export const usePokerTable = (telegramUser, bank) => {
	const { balance, setBalance } = useBalance()
	const [showConfetti, setShowConfetti] = useState(false)
	const [gameStarted, setGameStarted] = useState(false)
	const [bet, setBet] = useState(5)
	const [tableCards, setTableCards] = useState([])
	const [userCards, setUserCards] = useState([])
	const [computerCards, setComputerCards] = useState([])
	const [result, setResult] = useState('')
	const [textResult, setTextResult] = useState('')
	const [winnings, setWinnings] = useState(0)
	const [skip, setSkip] = useState(false)
	const [gameStage, setGameStage] = useState('initial') // 'initial', 'betting', 'reveal'
	const [chipBank, setChipBank] = useState(false)

	let allCards = []

	const navigate = useNavigate()

	const [newAllCards, setNewAllCards] = useState([])

	const emptyCard = {
		rank: 'unknown',
		suit: 'Empty',
		image: '/assets/cards/empty.png',
		combination: false,
	}

	useEffect(() => {
		if (balance <= 0) {
			setBalance(0)
			setTimeout(() => {
				navigate('/my-profile')
			}, 3000)
		}
	}, [balance])

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

	const increaseBet = () => {
		if (bet < balance) setBet(bet + 5)
	}

	const decreaseBet = () => {
		if (bet > 5) setBet(bet - 5)
	}

	const allIn = () => {
		setBet(balance)
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
			playerHandCards,
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

		const highestHandCard = sortedCards[0] || null // Изменено для обработки случаев, когда нет карт

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

		// Определение ранга руки и соответствующих карт
		switch (true) {
			case isRoyalFlush:
				return {
					...handEvaluation,
					hand: 'Royal Flush',
					winnings: bet * 50,
					combination: flushCards.length > 0 ? flushCards : [highestHandCard], // Обеспечиваем, что возвращаем карты
					highestHandCard,
				}
			case isStraightFlush:
				return {
					...handEvaluation,
					hand: 'Straight Flush',
					winnings: bet * 20,
					combination: flushCards.length > 0 ? flushCards : [highestHandCard],
					highestHandCard,
				}
			case fourOfKindCards.length === 4:
				return {
					...handEvaluation,
					hand: 'Four of a Kind',
					winnings: bet * 10,
					combination:
						fourOfKindCards.length > 0 ? fourOfKindCards : [highestHandCard],
					highestHandCard,
				}
			case fullHouseCards.length === 5:
				return {
					...handEvaluation,
					hand: 'Full House',
					winnings: bet * 5,
					combination:
						fullHouseCards.length > 0 ? fullHouseCards : [highestHandCard],
					highestHandCard,
				}
			case flushCards.length === 5:
				return {
					...handEvaluation,
					hand: 'Flush',
					winnings: bet * 4,
					combination: flushCards.length > 0 ? flushCards : [highestHandCard],
					highestHandCard,
				}
			case straightCards.length === 5:
				return {
					...handEvaluation,
					hand: 'Straight',
					winnings: bet * 3,
					combination:
						straightCards.length > 0 ? straightCards : [highestHandCard],
					highestHandCard,
				}
			case threeOfKindCards.length === 3:
				return {
					...handEvaluation,
					hand: 'Three of a Kind',
					winnings: bet * 2,
					combination:
						threeOfKindCards.length > 0 ? threeOfKindCards : [highestHandCard],
					highestHandCard,
				}
			case twoPairCards.length === 4:
				return {
					...handEvaluation,
					hand: 'Two Pair',
					winnings: bet * 1.5,
					combination:
						twoPairCards.length > 0 ? twoPairCards : [highestHandCard],
					highestHandCard,
				}
			case pairCards.length === 2:
				return {
					...handEvaluation,
					hand: 'One Pair',
					winnings: bet * 1,
					combination: pairCards.length > 0 ? pairCards : [highestHandCard],
					highestHandCard,
				}
			default:
				return {
					...handEvaluation,
					hand: 'High Card',
					winnings: 0,
					combination: highestHandCard ? [highestHandCard] : [],
					highestHandCard,
				}
		}
	}

	const dealInitialCards = () => {
		setGameStarted(true)
		setGameStage('betting')
		console.log(balance, bet)
		if (balance < bet) {
			setResult('Insufficient balance. Cannot deal.')
			return
		}

		const shuffledDeck = shuffleArray([...allCards])
		const newUserCards = shuffledDeck.slice(0, 2)
		setNewAllCards([...shuffledDeck.slice(2)])
		setUserCards(newUserCards)
		setComputerCards([emptyCard, emptyCard])
		setTableCards([emptyCard, emptyCard, emptyCard, emptyCard, emptyCard])
		setResult('')
		setWinnings(0)
	}

	const compareHighCards = (hand1, hand2) => {
		console.log('hand1', hand1)
		console.log('hand2', hand2)
		// Обе руки игроков, отсортированные по старшинству
		const sortedHand1 = [...hand1.playerHandCards].sort(
			(a, b) => b.rank - a.rank
		)
		const sortedHand2 = [...hand2.playerHandCards].sort(
			(a, b) => b.rank - a.rank
		)

		for (let i = 0; i < Math.min(sortedHand1.length, sortedHand2.length); i++) {
			if (sortedHand1[i].rank > sortedHand2[i].rank) {
				return { winner: 'user', card: sortedHand1[i] }
			} else if (sortedHand2[i].rank > sortedHand1[i].rank) {
				return { winner: 'trinity', card: sortedHand2[i] }
			}
		}

		// Если все карты равны, возвращаем ничью
		return { winner: 'tie', card: null }
	}

	const compareCombinationCards = (hand1, hand2) => {
		const handRank = {
			'Royal Flush': 10,
			'Straight Flush': 9,
			'Four of a Kind': 8,
			'Full House': 7,
			Flush: 6,
			Straight: 5,
			'Three of a Kind': 4,
			'Two Pair': 3,
			'One Pair': 2,
			'High Card': 1,
			'': 0, // Добавляем пустую комбинацию с наименьшим приоритетом
		}

		const getSortedCombination = hand => {
			switch (hand.hand) {
				case 'Four of a Kind':
					// Сортируем так, чтобы сначала шли карты комбинации, потом кикеры
					return [
						...hand.combination.filter(card => card.rank === hand.mainRank),
						...hand.combination.filter(card => card.rank !== hand.mainRank),
					]
				case 'Full House':
					// Тройка должна быть впереди пары
					return [
						...hand.combination.filter(card => card.rank === hand.mainRank),
						...hand.combination.filter(card => card.rank !== hand.mainRank),
					]
				case 'Two Pair':
					// Две пары идут впереди, потом кикер
					const pairs = hand.combination.filter(
						card =>
							card.rank === hand.mainRank || card.rank === hand.secondaryRank
					)
					const kicker = hand.combination.find(
						card =>
							card.rank !== hand.mainRank && card.rank !== hand.secondaryRank
					)
					return [...pairs.sort((a, b) => b.rank - a.rank), kicker]
				default:
					// Для остальных комбинаций (например, Flush, Straight и др.) сортируем карты по старшинству
					return [...hand.combination].sort((a, b) => b.rank - a.rank)
			}
		}

		// Проверка на отсутствие комбинации у одного из игроков
		if (handRank[hand1.hand] > handRank[hand2.hand]) return 'user'
		if (handRank[hand1.hand] < handRank[hand2.hand]) return 'trinity'

		// Продолжаем с существующей логикой сравнения карт, если комбинации равны
		const sortedHand1 = getSortedCombination(hand1)
		const sortedHand2 = getSortedCombination(hand2)

		for (let i = 0; i < Math.min(sortedHand1.length, sortedHand2.length); i++) {
			if (sortedHand1[i].rank > sortedHand2[i].rank) return 'user'
			if (sortedHand1[i].rank < sortedHand2[i].rank) return 'trinity'
		}

		return 'tie'
	}

	const revealCards = () => {
		setGameStage('reveal')
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
			// console.log('user', evaluation)
			if (evaluation.winnings >= bestUserHand.winnings) {
				bestUserHand = evaluation
			}
		})

		let bestComputerHand = { winnings: 0, combination: [], hand: '' }
		computerCombinations.forEach(hand => {
			const evaluation = evaluateHand(hand, newComputerCards)
			// console.log('computer', evaluation)
			if (evaluation.winnings >= bestComputerHand.winnings) {
				bestComputerHand = evaluation
			}
		})

		let winningCombination = []
		let newWinnings = 0
		let bestHandCardForTie = ''

		console.log('bestUserHand', bestUserHand)
		console.log('bestComputerHand', bestComputerHand)

		if (compareCombinationCards(bestUserHand, bestComputerHand) === 'user') {
			setTextResult('You win')
			setResult(`You win with ${bestUserHand.hand}!`)
			newWinnings = bestUserHand.winnings
			winningCombination = bestUserHand.combination
		} else if (
			compareCombinationCards(bestUserHand, bestComputerHand) === 'trinity'
		) {
			setTextResult('You lose')
			setResult(`Trinity wins with ${bestComputerHand.hand}!`)
			newWinnings = 0
			winningCombination = bestComputerHand.combination
		} else {
			// Tie - compare cards in hand
			const comparison = compareHighCards(bestUserHand, bestComputerHand)

			console.log('comparison', comparison)

			switch (comparison.winner) {
				case 'user':
					console.log('user')
					setResult(`You win with ${bestUserHand.hand}`)
					setTextResult('You win')
					newWinnings = bestUserHand.winnings
					// Important: Use the full winning combination, not just the high card
					winningCombination = bestUserHand.combination
					bestHandCardForTie = comparison?.card?.image || ''
					break
				case 'trinity':
					setResult(`Trinity wins with ${bestComputerHand.hand}`)
					setTextResult('You lose')
					newWinnings = 0
					// Important: Use the full winning combination, not just the high card
					winningCombination = bestComputerHand.combination
					bestHandCardForTie = comparison?.card?.image || ''
					break
				case 'tie':
					setResult(`It's a tie with ${bestUserHand.hand}!`)
					setTextResult('Tie')
					newWinnings = bet
					winningCombination = bestUserHand.combination
					bestHandCardForTie = comparison?.card?.image || ''
					break
				default:
					break
			}
		}

		const updateCombinationFlag = (
			cards,
			winningCombination,
			bestHandCardForTie = ''
		) => {
			return cards.map(card => ({
				...card,
				combination:
					winningCombination.some(
						winCard => winCard.rank === card.rank && winCard.suit === card.suit
					) || card.image === bestHandCardForTie,
			}))
		}

		setUserCards(
			updateCombinationFlag(
				newUserCards,
				winningCombination,
				bestHandCardForTie
			)
		)
		setComputerCards(
			updateCombinationFlag(
				newComputerCards,
				winningCombination,
				bestHandCardForTie
			)
		)
		setTableCards(
			updateCombinationFlag(
				newTableCards,
				winningCombination,
				bestHandCardForTie
			)
		)

		setWinnings(newWinnings)
		setTimeout(() => {
			setChipBank(true)
		}, 1600)
		setTimeout(() => {
			setBalance(prevBank => prevBank - bet + newWinnings)
		}, 2000)
	}

	const startNewGame = () => {
		setChipBank(false)
		setShowConfetti(true)
		setGameStage('betting')
		setGameStarted(false)
		setSkip(true)
		setUserCards([])
		setComputerCards([])
		setTableCards([])
		setResult('')
		setTextResult('')
		setWinnings(0)
		setBet(5)
		setTimeout(() => {
			/* `setShowConfetti(false)` is a function call that updates the state variable `showConfetti` to
			`false`. This means that it will hide or stop the confetti animation on the poker table interface
			by setting the `showConfetti` state to `false`. */
			// setShowConfetti(false)
			dealInitialCards()
		}, 750)
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
		setBalance,
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
		textResult,
		allIn,
		skip,
		chipBank,
	}
}
