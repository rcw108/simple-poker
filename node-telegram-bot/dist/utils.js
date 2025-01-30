"use strict";
const shuffleDeck = () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
    const deck = [];
    suits.forEach(suit => {
        ranks.forEach(rank => {
            deck.push({ suit, rank });
        });
    });
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};
const evaluateHand = cards => {
    if (getFourOfAKind(cards).length)
        return { hand: 'Four of a Kind', rank: 8 };
    if (getFullHouse(cards).length)
        return { hand: 'Full House', rank: 7 };
    if (getFlush(cards).length)
        return { hand: 'Flush', rank: 6 };
    if (getStraight(cards).length)
        return { hand: 'Straight', rank: 5 };
    if (getThreeOfAKind(cards).length)
        return { hand: 'Three of a Kind', rank: 4 };
    if (getTwoPair(cards).length)
        return { hand: 'Two Pair', rank: 3 };
    if (getPair(cards).length)
        return { hand: 'One Pair', rank: 2 };
    return { hand: 'High Card', rank: 1 };
};
module.exports = {
    shuffleDeck,
    evaluateHand,
};
