// Helper functions
export const getRankCounts = cards => {
	const counts = {}
	cards.forEach(card => {
		counts[card.rank] = (counts[card.rank] || 0) + 1
	})
	return counts
}

export const getSuitCounts = cards => {
	const counts = {}
	cards.forEach(card => {
		counts[card.suit] = (counts[card.suit] || 0) + 1
	})
	return counts
}

// Main combination functions
export const getFourOfAKind = cards => {
	const rankCounts = getRankCounts(cards)
	const fourOfAKindRank = Object.keys(rankCounts).find(
		rank => rankCounts[rank] === 4
	)
	if (!fourOfAKindRank) return []
	// Return exactly 4 cards of the same rank
	return cards.filter(card => card.rank === parseInt(fourOfAKindRank))
}

export const getFullHouse = cards => {
	const rankCounts = getRankCounts(cards)
	const threeOfAKindRank = Object.keys(rankCounts).find(
		rank => rankCounts[rank] === 3
	)
	const pairRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 2)
	if (!threeOfAKindRank || !pairRank) return []
	// Return exactly 5 cards: three of one rank and two of another
	return [
		...cards.filter(card => card.rank === parseInt(threeOfAKindRank)),
		...cards.filter(card => card.rank === parseInt(pairRank)),
	]
}

export const getFlush = cards => {
	const suitsCount = getSuitCounts(cards)
	const flushSuit = Object.keys(suitsCount).find(suit => suitsCount[suit] >= 5)
	if (!flushSuit) return []
	// Return exactly 5 highest cards of the same suit
	return cards
		.filter(card => card.suit === flushSuit)
		.sort((a, b) => b.rank - a.rank)
		.slice(0, 5)
}

export const getStraight = cards => {
	// Remove duplicate ranks and sort
	const uniqueRanks = [...new Set(cards.map(card => card.rank))]
	uniqueRanks.sort((a, b) => b - a)

	// Handle Ace for low straight
	if (uniqueRanks.includes(14)) uniqueRanks.push(1)

	for (let i = 0; i <= uniqueRanks.length - 5; i++) {
		if (
			uniqueRanks[i] - 1 === uniqueRanks[i + 1] &&
			uniqueRanks[i] - 2 === uniqueRanks[i + 2] &&
			uniqueRanks[i] - 3 === uniqueRanks[i + 3] &&
			uniqueRanks[i] - 4 === uniqueRanks[i + 4]
		) {
			const straightRanks = uniqueRanks.slice(i, i + 5)
			// Handle special case for Ace-to-5 straight
			if (straightRanks[4] === 1) {
				straightRanks[4] = 14 // Convert back to Ace
			}
			// Return exactly 5 cards forming the straight
			return cards
				.filter(card => straightRanks.includes(card.rank))
				.sort((a, b) => b.rank - a.rank)
				.slice(0, 5)
		}
	}
	return []
}

export const getThreeOfAKind = cards => {
	const rankCounts = getRankCounts(cards)
	const threeOfAKindRank = Object.keys(rankCounts).find(
		rank => rankCounts[rank] === 3
	)
	if (!threeOfAKindRank) return []
	// Return exactly 3 cards of the same rank
	return cards.filter(card => card.rank === parseInt(threeOfAKindRank))
}

export const getTwoPair = cards => {
	const rankCounts = getRankCounts(cards)
	const pairs = Object.keys(rankCounts)
		.filter(rank => rankCounts[rank] === 2)
		.sort((a, b) => b - a)
	if (pairs.length < 2) return []
	// Return exactly 4 cards: two from each pair
	return [
		...cards.filter(card => card.rank === parseInt(pairs[0])),
		...cards.filter(card => card.rank === parseInt(pairs[1])),
	]
}

export const getPair = cards => {
	const rankCounts = getRankCounts(cards)
	const pairRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 2)
	if (!pairRank) return []
	// Return exactly 2 cards forming the pair
	return cards.filter(card => card.rank === parseInt(pairRank))
}

export const getHighCard = (cards1, cards2) => {
	// Sort both hands by rank
	const sorted1 = cards1.sort((a, b) => b.rank - a.rank)
	const sorted2 = cards2.sort((a, b) => b.rank - a.rank)

	// Compare highest cards
	if (sorted1[0].rank > sorted2[0].rank) {
		return [sorted1[0]]
	} else if (sorted2[0].rank > sorted1[0].rank) {
		return [sorted2[0]]
	} else {
		// If equal, return the first high card
		return [sorted1[0]]
	}
}
