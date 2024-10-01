// script.js

// Dummy data for card dealing
const deck = ['3 ♣', '3 ♠', '4 ♦', '4 ♣', '2 ♥'];
let bank = 500;
let bet = 10;

// Function to deal cards and show a win message
function dealCards() {
  // Display the dummy cards
  document.getElementById('card1').innerText = deck[0];
  document.getElementById('card2').innerText = deck[1];
  document.getElementById('card3').innerText = deck[2];
  document.getElementById('card4').innerText = deck[3];
  document.getElementById('card5').innerText = deck[4];

  // Display win message
  document.getElementById('result-message').innerText = 'Флеш! Win 40';

  // Update bank and bet
  bank += 40;  // Assuming the player wins
  document.getElementById('bank').innerText = `Банк: ${bank}`;
  document.getElementById('bet').innerText = `Ставка: ${bet}`;
}

// Event listener for the deal button
document.getElementById('deal-button').addEventListener('click', dealCards);
