import { Card, Rank, Suit } from './interfaces/card.interface.js'

type RankCounts = {
	[key in Rank]: number
}

type SuitCounts = {
	[key in Suit]: number
}

export const getRankCounts = (cards: Card[]): RankCounts => {
	const counts: RankCounts = {} as RankCounts
	cards.forEach(card => {
		counts[card.rank] = (counts[card.rank] || 0) + 1
	})
	return counts
}

export const getSuitCounts = (cards: Card[]): SuitCounts => {
	const counts: SuitCounts = {} as SuitCounts
	cards.forEach(card => {
		counts[card.suit] = (counts[card.suit] || 0) + 1
	})
	return counts
}

export const getFourOfAKind = (cards: Card[]) => {
	const rankCounts = getRankCounts(cards)
	const fourOfAKindRank = Object.keys(rankCounts).find(
		rank => rankCounts[rank as Rank] === 4
	) as Rank | undefined
	if (!fourOfAKindRank) return []
	return cards.filter(card => card.rank === fourOfAKindRank)
}

export const getFullHouse = (cards: Card[]) => {
	const rankCounts = getRankCounts(cards)
	const threeOfAKindRank = Object.keys(rankCounts).find(
		rank => rankCounts[rank as Rank] === 3
	) as Rank | undefined
	const pairRank = Object.keys(rankCounts).find(
		rank => rankCounts[rank as Rank] === 2
	) as Rank | undefined
	if (!threeOfAKindRank || !pairRank) return []
	return [
		...cards.filter(card => card.rank === threeOfAKindRank),
		...cards.filter(card => card.rank === pairRank),
	]
}

export const getFlush = (cards: Card[]) => {
	const suitsCount = getSuitCounts(cards)
	const flushSuit = Object.keys(suitsCount).find(
		suit => suitsCount[suit as Suit] >= 5
	) as Suit | undefined
	if (!flushSuit) return []
	return cards
		.filter(card => card.suit === flushSuit)
		.map(card => ({ ...card, rank: Number(card.rank) }))
		.sort((a, b) => b.rank - a.rank)
		.slice(0, 5)
}

export const getStraight = (cards: Card[]) => {
	const uniqueRanks = [...new Set(cards.map(card => card.rank as number))]
	uniqueRanks.sort((a, b) => b - a)

	if (uniqueRanks.includes(14)) uniqueRanks.push(1)

	for (let i = 0; i <= uniqueRanks.length - 5; i++) {
		if (
			uniqueRanks[i] - 1 === uniqueRanks[i + 1] &&
			uniqueRanks[i] - 2 === uniqueRanks[i + 2] &&
			uniqueRanks[i] - 3 === uniqueRanks[i + 3] &&
			uniqueRanks[i] - 4 === uniqueRanks[i + 4]
		) {
			const straightRanks = uniqueRanks.slice(i, i + 5)
			if (straightRanks[4] === 1) {
				straightRanks[4] = 14
			}
			return cards
				.filter(card => straightRanks.includes(Number(card.rank)))
				.sort((a, b) => Number(b.rank) - Number(a.rank))
				.slice(0, 5)
		}
	}
	return []
}

export const getThreeOfAKind = (cards: Card[]) => {
	const rankCounts = getRankCounts(cards)
	const threeOfAKindRank = Object.keys(rankCounts).find(
		rank => rankCounts[rank as keyof typeof rankCounts] === 3
	)
	if (!threeOfAKindRank) return []
	return cards.filter(card => card.rank === parseInt(threeOfAKindRank))
}

export const getTwoPair = (cards: Card[]) => {
	const rankCounts = getRankCounts(cards)
	const pairs = Object.keys(rankCounts)
		.filter(rank => rankCounts[rank as keyof typeof rankCounts] === 2)
		.sort((a, b) => Number(b) - Number(a))
	if (pairs.length < 2) return []
	return [
		...cards.filter(card => card.rank === parseInt(pairs[0])),
		...cards.filter(card => card.rank === parseInt(pairs[1])),
	]
}

export const getPair = (cards: Card[]) => {
	const rankCounts = getRankCounts(cards)
	const pairRank = Object.keys(rankCounts).find(
		rank => rankCounts[rank as keyof typeof rankCounts] === 2
	)
	if (!pairRank) return []
	return cards.filter(card => card.rank === parseInt(pairRank))
}

export const getHighCard = (cards1: Card[], cards2: Card[]) => {
	const sorted1 = cards1.sort((a, b) => Number(b.rank) - Number(a.rank))
	const sorted2 = cards2.sort((a, b) => Number(b.rank) - Number(a.rank))

	if (sorted1[0].rank > sorted2[0].rank) {
		return [sorted1[0]]
	} else if (sorted2[0].rank > sorted1[0].rank) {
		return [sorted2[0]]
	} else {
		return [sorted1[0]]
	}
}
