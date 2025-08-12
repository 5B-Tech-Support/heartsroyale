export const SOCKET_URL = "https://hearts-royale-server.onrender.com";
export const CARD_IMG = (rank, suit) => {
  // Uses Deck of Cards API static images (fast, reliable)
  // rank: 'A','K','Q','J','10','9','8','7','6','5','4','3','2'
  // suit: 'hearts','diamonds','clubs','spades'
  const r = rank === '10' ? '0' : rank[0];
  const s = suit[0].toUpperCase(); // H, D, C, S
  return `https://deckofcardsapi.com/static/img/${r}${s}.png`;
};
