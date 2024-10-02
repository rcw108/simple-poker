import React, { useState } from 'react';
import './PokerTable.css';

const PokerTable = () => {
  // Initialize state variables
  const [bank, setBank] = useState(500);
  const [bet, setBet] = useState(10);
  const [tableCards, setTableCards] = useState([]);
  const [userCards, setUserCards] = useState([]);
  const [result, setResult] = useState(""); // For showing the "Flash" or other hand result
  const [winnings, setWinnings] = useState(0); // Track winnings from the hand

  // Casino win rate target: 15-20%
  const casinoBiasThreshold = 0.15; // 15% chance of user losing (adjustable)

  // Card data (to be replaced with actual paths to images)
  const allCards = [
    '/assets/cards/2q.png', '/assets/cards/2a.png', '/assets/cards/2s.png', '/assets/cards/2w.png',
    '/assets/cards/3e.png', '/assets/cards/3q.png', '/assets/cards/3r.png', '/assets/cards/3w.png',
    '/assets/cards/4e.png', '/assets/cards/4q.png', '/assets/cards/4r.png', '/assets/cards/4w.png',
    '/assets/cards/5e.png', '/assets/cards/5q.png', '/assets/cards/5r.png', '/assets/cards/5w.png',
    '/assets/cards/6e.png', '/assets/cards/6q.png', '/assets/cards/6r.png', '/assets/cards/6w.png',
    '/assets/cards/7e.png', '/assets/cards/7q.png', '/assets/cards/7r.png', '/assets/cards/7w.png',
    '/assets/cards/8e.png', '/assets/cards/8q.png', '/assets/cards/8r.png', '/assets/cards/8w.png',
    '/assets/cards/9e.png', '/assets/cards/9q.png', '/assets/cards/9r.png', '/assets/cards/9w.png',
    '/assets/cards/10e.png', '/assets/cards/10q.png', '/assets/cards/10r.png', '/assets/cards/10w.png',
    '/assets/cards/a1.png', '/assets/cards/a2.png', '/assets/cards/a3.png', '/assets/cards/a4.png',
    '/assets/cards/k1.png', '/assets/cards/k2.png', '/assets/cards/k3.png', '/assets/cards/k4.png',
    '/assets/cards/q1.png', '/assets/cards/q2.png', '/assets/cards/q3.png', '/assets/cards/q4.png',
    '/assets/cards/w1.png', '/assets/cards/w2.png', '/assets/cards/w3.png', '/assets/cards/w4.png',
  ];

   // Increase the bet
   const increaseBet = () => {
    if (bet < bank) setBet(bet + 10); // Increase bet by 10, only if there is enough balance
  };

  // Decrease the bet
  const decreaseBet = () => {
    if (bet > 10) setBet(bet - 10); // Minimum bet is 10
  };

  // Helper functions to evaluate hands
  const getCardValue = (card) => {
    const valueMap = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    const rank = card.match(/\d+|[JQKA]/)[0]; // Extract rank (e.g., '2', 'J', 'A')
    return valueMap[rank];
  };

  const getCardSuit = (card) => card.match(/[a-z]$/)[0]; // Extract suit from the card (e.g., 's' for spades)

  // Check for specific poker hands
  const isFlush = (cards) => cards.map(card => getCardSuit(card)).every(suit => suit === cards[0][1]);
  const isStraight = (cards) => {
    const values = cards.map(card => getCardValue(card)).sort((a, b) => a - b);
    return values.every((val, idx) => idx === 0 || val === values[idx - 1] + 1);
  };

  // Adjusted hand probabilities (fixed bonus for each hand)
  const handProbabilities = [
    { name: "Royal Flush", chance: 0.0032, bonus: 1000 },
    { name: "Straight Flush", chance: 0.0279, bonus: 50 },
    { name: "Four of a Kind", chance: 0.168, bonus: 40 },
    { name: "Full House", chance: 2.60, bonus: 30 },
    { name: "Flush", chance: 3.03, bonus: 20 },
    { name: "Straight", chance: 4.62, bonus: 15 },
    { name: "Three of a Kind", chance: 4.83, bonus: 10 },
    { name: "Two Pair", chance: 23.5, bonus: 5 },
    { name: "One Pair", chance: 43.8, bonus: 2 },
    { name: "High Card", chance: 71.4, bonus: 1 }
  ];

  // Biased hand rank calculation based on probabilities
  const getBiasedHandRank = (allCards) => {
    const rand = Math.random() * 100;
    let cumulativeChance = 0;

    for (const hand of handProbabilities) {
      cumulativeChance += hand.chance;
      if (rand < cumulativeChance) {
        return { hand: hand.name, bonus: hand.bonus };
      }
    }
    return { hand: "High Card", bonus: 1 }; // Default to High Card
  };

  // Shuffle array of cards
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Deal cards (on button click)
  const dealCards = () => {
    if (bank < 10) {
      setResult("Out of Balance. Cannot deal.");
      return; // Prevent dealing if bank balance is 0
    }

    // Shuffle the deck
    const shuffledDeck = shuffleArray([...allCards]);

    // Deal 5 cards to the table and 2 cards to the user
    const tableCards = shuffledDeck.slice(0, 5);
    const userCards = shuffledDeck.slice(5, 7);

    setTableCards(tableCards);
    setUserCards(userCards);

    // Combine all cards to evaluate the hand
    const allPlayerCards = [...tableCards, ...userCards];
    const { hand, bonus } = getBiasedHandRank(allPlayerCards);

    // Update the result with the hand rank
    setResult(hand);

    // Calculate winnings: subtract bet, add bonus
    const netChange = bonus - bet; // Bank will be adjusted by the bonus minus the bet
    setWinnings(bonus);

    setBank(bank + netChange);  // Update bank with the new winnings
  };

  return (
    <div className="poker-table">
      {/* Header Section */}
      <div className="header">
        <img src="/assets/cardsgroup.png" alt="Cards" className="cards-header" />
        <div className="crown-section">
          <img src="/assets/icons8-crown-96 1.png" alt="Crown" className="crown-icon" />
          <span className="chips">{bank}</span>
        </div>
      </div>

      {/* Game Section */}
      <div className="cards-section">
        {/* Show table cards */}
        <div className="table-cards">
          {tableCards.map((card, index) => (
            <img key={index} src={card} alt={`Table card ${index}`} className="card" />
          ))}
        </div>

        {/* Show user cards */}
        <div className="user-cards">
          {userCards.map((card, index) => (
            <img key={index} src={card} alt={`User card ${index}`} className="card" />
          ))}
        </div>

        {/* Flash text and win result */}
        <div className="flash-text">{result}</div>
        <div className="win-text">WIN {winnings}</div>
      </div>

      {/* Controls Section */}
      <div className="controls">
        <div className="bank">
          <div className="bank-icon-container">
            <img src="/assets/PokerChips1.png" alt="Chips" className="bank-icon" />
            <div className="bank-value">{bank}</div>
          </div>
          <div className="bank-text">Банк</div>
        </div>

        <button className="deal-button" onClick={dealCards}>Раздать</button>

        <div className="bet">
          <div className="bet-icon-container">
            <img src="/assets/PokerChip2.png" alt="Bet" className="bet-icon" />
            <div className="bet-value">{bet}</div>
          </div>
          <div className="bet-text">Ставка</div>
          <div className="bet-controls">
            <button className="bet-minus" onClick={decreaseBet}>-</button>
            <button className="bet-plus" onClick={increaseBet}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokerTable;