// UI helpers for Hearts Royale
import { CARD_IMG } from './config.js';

export function el(sel){ return document.querySelector(sel); }
export function els(sel){ return Array.from(document.querySelectorAll(sel)); }

export function setText(sel, txt){ const e = el(sel); if(e) e.textContent = txt; }
export function show(sel){ const e = el(sel); if(e) e.classList.remove('hidden'); }
export function hide(sel){ const e = el(sel); if(e) e.classList.add('hidden'); }

export function makeCard(rank, suit, disabled=false){
  const d = document.createElement('div');
  d.className = 'card' + (disabled ? ' disabled': '');
  const img = document.createElement('img');
  img.src = CARD_IMG(rank, suit);
  img.alt = `${rank} of ${suit}`;
  d.appendChild(img);
  return d;
}

export function layoutHand(container, cards, onPlay){
  container.innerHTML = '';
  cards.forEach((c, i) => {
    const node = makeCard(c.rank, c.suit, !!c.disabled);
    if(!c.disabled){
      node.addEventListener('click', () => onPlay(i));
    }
    container.appendChild(node);
  });
}

export function animateToSlot(cardNode, slotNode){
  const rect1 = cardNode.getBoundingClientRect();
  const rect2 = slotNode.getBoundingClientRect();
  const dx = rect2.left - rect1.left;
  const dy = rect2.top - rect1.top;
  gsap.to(cardNode, { x: dx, y: dy, rotation: 0, duration: 0.7, ease: "power2.out" });
}

export function toast(msg){
  const tip = el('#tooltip');
  tip.textContent = msg;
  show('#tooltip');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => hide('#tooltip'), 1800);
}
