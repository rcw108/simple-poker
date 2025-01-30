export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'J' | 'Q' | 'K' | 'A'
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

export interface Card {
	suit: Suit
	rank: Rank
}

export type GameStage = 'initial' | 'betting' | 'reveal'

export interface Player {
	id: string
	cards: Card[]
	username?: string
	balance: number
}

export interface GameRoom {
	[roomId: string]: {
		players: Player[]
		deck: Card[]
		tableCards: Card[]
		stage: GameStage
		bank: number
	}
}

export interface WithdrawRequestBody {
	userId: string
	amount: number
	toAddress: string
}

export interface IUser {
	id: number
	balance: number
	address: string
}
