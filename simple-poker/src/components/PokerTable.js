import React, { useState } from 'react';
import './PokerTable.css';

const PokerTable = () => {
  // Initialize state variables
  const [bank, setBank] = useState(500);
  const [bet, setBet] = useState(10);
  const [tableCards, setTableCards] = useState([]);
  const [userCards, setUserCards] = useState([]);
  const [result, setResult] = useState("");
  const [winnings, setWinnings] = useState(0);

  // Define the mapping for suits based on your filenames
  const suitMap = {
    'q': 'hearts',
    'a': 'diamonds',
    's': 'clubs',
    'w': 'spades',
    'e': 'hearts',
    'r': 'diamonds',
    // Add other mappings if necessary
  };

  // Define the mapping for face card ranks
  const rankMap = {
    'j': 11,
    'q': 12,
    'k': 13,
    'a': 14,
  };

  // Generate the deck
  const allCards = [];

  // List of all your card filenames (without the '/assets/cards/' prefix and '.png' suffix)
  const cardFilenames = [
    '2q', '2a', '2s', '2w',
    '3e', '3q', '3r', '3w',
    '4e', '4q', '4r', '4w',
    '5e', '5q', '5r', '5w',
    '6e', '6q', '6r', '6w',
    '7e', '7q', '7r', '7w',
    '8e', '8q', '8r', '8w',
    '9e', '9q', '9r', '9w',
    '10e', '10q', '10r', '10w',
    'a1', 'a2', 'a3', 'a4',
    'k1', 'k2', 'k3', 'k4',
    'q1', 'q2', 'q3', 'q4',
    'w1', 'w2', 'w3', 'w4',
  ];

  // Build the allCards array
  cardFilenames.forEach((filename) => {
    const match = filename.match(/^(\d+|[jqka])([a-z0-9])/i);
    if (match) {
      let [_, rankStr, suitLetter] = match;
      let rank = parseInt(rankStr, 10);
      if (isNaN(rank)) {
        rank = rankMap[rankStr.toLowerCase()];
      }
      const suit = suitMap[suitLetter.toLowerCase()];
      if (suit) {
        allCards.push({
          rank,
          suit,
          image: `/assets/cards/${filename}.png`,
        });
      }
    }
  });

  // Increase the bet
  const increaseBet = () => {
    if (bet < bank) setBet(bet + 10);
  };

  // Decrease the bet
  const decreaseBet = () => {
    if (bet > 10) setBet(bet - 10);
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

  // Function to get all combinations of a certain size
  const getCombinations = (array, size) => {
    const results = [];

    const helper = (start, combo) => {
      if (combo.length === size) {
        results.push(combo);
        return;
      }
      for (let i = start; i < array.length; i++) {
        helper(i + 1, combo.concat(array[i]));
      }
    };

    helper(0, []);
    return results;
  };

  // Evaluate hand function
  const evaluateHand = (cards) => {
    // Sort cards by rank
    const sortedCards = cards.slice().sort((a, b) => a.rank - b.rank);

    // Check for Flush
    const suitsCount = {};
    cards.forEach((card) => {
      suitsCount[card.suit] = (suitsCount[card.suit] || 0) + 1;
    });
    const flushSuit = Object.keys(suitsCount).find((suit) => suitsCount[suit] >= 5);
    const isFlush = !!flushSuit;

    // Check for Straight
    let ranks = [...new Set(sortedCards.map((card) => card.rank))];
    let isStraight = false;

    // Handle low-Ace straight (A-2-3-4-5)
    if (ranks.includes(14)) {
      ranks.push(1); // Treat Ace as low
    }
    ranks.sort((a, b) => a - b);

    for (let i = 0; i <= ranks.length - 5; i++) {
      if (
        ranks[i] + 1 === ranks[i + 1] &&
        ranks[i] + 2 === ranks[i + 2] &&
        ranks[i] + 3 === ranks[i + 3] &&
        ranks[i] + 4 === ranks[i + 4]
      ) {
        isStraight = true;
        break;
      }
    }

    // Check for Straight Flush and Royal Flush
    let isStraightFlush = false;
    let isRoyalFlush = false;
    if (isFlush) {
      const flushCards = cards.filter((card) => card.suit === flushSuit);
      const flushRanks = [...new Set(flushCards.map((card) => card.rank))];
      if (flushRanks.includes(14)) {
        flushRanks.push(1);
      }
      flushRanks.sort((a, b) => a - b);
      for (let i = 0; i <= flushRanks.length - 5; i++) {
        if (
          flushRanks[i] + 1 === flushRanks[i + 1] &&
          flushRanks[i] + 2 === flushRanks[i + 2] &&
          flushRanks[i] + 3 === flushRanks[i + 3] &&
          flushRanks[i] + 4 === flushRanks[i + 4]
        ) {
          isStraightFlush = true;
          if (flushRanks.slice(i, i + 5).includes(14) && flushRanks.slice(i, i + 5).includes(10)) {
            isRoyalFlush = true;
          }
          break;
        }
      }
    }

    // Count card occurrences
    const counts = {};
    cards.forEach((card) => {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    });
    const countsValues = Object.values(counts);
    const hasFourOfKind = countsValues.includes(4);
    const hasThreeOfKind = countsValues.includes(3);
    const pairs = countsValues.filter((count) => count === 2).length;

    // Determine hand rank
    if (isRoyalFlush) return { hand: "Royal Flush", multiplier: 250 };
    if (isStraightFlush) return { hand: "Straight Flush", multiplier: 50 };
    if (hasFourOfKind) return { hand: "Four of a Kind", multiplier: 25 };
    if (hasThreeOfKind && pairs >= 1) return { hand: "Full House", multiplier: 9 };
    if (isFlush) return { hand: "Flush", multiplier: 6 };
    if (isStraight) return { hand: "Straight", multiplier: 4 };
    if (hasThreeOfKind) return { hand: "Three of a Kind", multiplier: 3 };
    if (pairs >= 2) return { hand: "Two Pair", multiplier: 2 };
    if (pairs === 1) return { hand: "One Pair", multiplier: 1 };
    return { hand: "High Card", multiplier: 0 };
  };

  // Deal cards (on button click)
  const dealCards = () => {
    if (bank < bet) {
      setResult("Insufficient balance. Cannot deal.");
      return;
    }

    const shuffledDeck = shuffleArray([...allCards]);

    const newUserCards = shuffledDeck.slice(0, 2);
    const newTableCards = shuffledDeck.slice(2, 7);

    setUserCards(newUserCards);
    setTableCards(newTableCards);

    const allPlayerCards = [...newUserCards, ...newTableCards];

    // Generate all possible 5-card combinations
    const combinations = getCombinations(allPlayerCards, 5);

    // Evaluate each hand to find the best one
    let bestHand = { multiplier: 0 };
    combinations.forEach((hand) => {
      const evaluation = evaluateHand(hand);
      if (evaluation.multiplier > bestHand.multiplier) {
        bestHand = evaluation;
      }
    });

    setResult(bestHand.hand);
    const winAmount = bet * bestHand.multiplier;
    setWinnings(winAmount);

    setBank(bank - bet + winAmount);
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
            <img key={index} src={card.image} alt={`Table card ${index}`} className="card" />
          ))}
        </div>

        {/* Show user cards */}
        <div className="user-cards">
          {userCards.map((card, index) => (
            <img key={index} src={card.image} alt={`User card ${index}`} className="card" />
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