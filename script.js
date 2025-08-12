// Simple Hearts Royale card test
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = ['A','K','Q','J','10','9','8','7','6','5','4','3','2'];

// Generate deck using card image URLs
function getCardURL(rank, suit) {
    return `https://deckofcardsapi.com/static/img/${rank[0] === '1' ? '0' : rank[0]}${suit[0].toUpperCase()}.png`;
}

const handDiv = document.getElementById('hand');
const centerDiv = document.getElementById('center');

// Deal random 13 cards to hand
let deck = [];
for (let s of suits) {
    for (let r of ranks) {
        deck.push({rank: r, suit: s, url: getCardURL(r, s)});
    }
}
deck = deck.sort(() => Math.random() - 0.5);
let hand = deck.slice(0, 13);

function renderHand() {
    handDiv.innerHTML = '';
    hand.forEach((card, index) => {
        const img = document.createElement('img');
        img.src = card.url;
        img.alt = `${card.rank} of ${card.suit}`;
        img.addEventListener('click', () => playCard(index));
        handDiv.appendChild(img);
    });
}

function playCard(index) {
    const card = hand.splice(index, 1)[0];
    const img = document.createElement('img');
    img.src = card.url;
    img.alt = `${card.rank} of ${card.suit}`;
    centerDiv.appendChild(img);
    renderHand();
}

renderHand();
