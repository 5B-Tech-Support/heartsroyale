// Hearts Royale Client
import { SOCKET_URL } from './config.js';
import { el, els, setText, show, hide, layoutHand, animateToSlot, toast } from './ui.js';

// --- 3D Table Setup (Three.js) ---
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f4c2b);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 6, 9);
camera.lookAt(0, 0, 0);
scene.add(camera);

const light = new THREE.DirectionalLight(0xffffff, 1.15);
light.position.set(-3, 6, 6);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

// Table (rounded box look)
const tableGeom = new THREE.CylinderGeometry(6, 6, 0.6, 64);
const tableMat = new THREE.MeshStandardMaterial({ color: 0x0b3d22, roughness: 0.9, metalness: 0.02 });
const table = new THREE.Mesh(tableGeom, tableMat);
table.position.y = -0.3;
scene.add(table);

function onResize(){
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w/h; camera.updateProjectionMatrix();
  renderer.setSize(w,h);
}
window.addEventListener('resize', onResize);

function loop(){
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();

// --- Sound (subtle) ---
const sfx = {
  play: new Audio('https://cdn.jsdelivr.net/gh/joshwcomeau/ambient-sound-kit/cardPlace.mp3'),
  flip: new Audio('https://cdn.jsdelivr.net/gh/joshwcomeau/ambient-sound-kit/cardFlip.mp3'),
  score: new Audio('https://cdn.jsdelivr.net/gh/joshwcomeau/ambient-sound-kit/softBell.mp3'),
};
Object.values(sfx).forEach(a => { a.volume = 0.25; });

const btnSound = el('#btn-sound');
let soundOn = true;
btnSound?.addEventListener('click', () => {
  soundOn = !soundOn;
  btnSound.textContent = `Sound: ${soundOn ? 'On' : 'Off'}`;
});
function playSfx(a){ if(soundOn) a.currentTime = 0, a.play(); }

// --- Socket.IO ---
const socket = io(SOCKET_URL, { transports: ['websocket'] });

// Session state
let me = { id: null, name: 'You' };
let room = null;
let hand = [];
let legal = [];
let isMyTurn = false;
let downUsed = false;

// UI refs
const handDiv = el('#hand');
const leadSlot = el('#lead-slot');
const respSlot = el('#resp-slot');
const lobby = el('#lobby');
const hud = el('#hud');
const status = el('#status');

// Lobby controls
el('#btn-save-name')?.addEventListener('click', () => {
  const n = el('#username').value.trim().slice(0,16) || 'Player';
  me.name = n;
  toast('Name saved');
});

el('#btn-create')?.addEventListener('click', () => {
  const withAI = el('#chk-ai').checked;
  socket.emit('createRoom', { name: me.name, withAI });
});

el('#btn-join')?.addEventListener('click', () => {
  const code = el('#join-code').value.trim().toUpperCase();
  if(code.length < 4) return toast('Enter a valid room code');
  socket.emit('joinRoomByCode', { name: me.name, code });
});

// Rooms list
socket.on('rooms', (rooms) => {
  const wrap = el('#rooms');
  wrap.innerHTML = '';
  rooms.forEach(r => {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `<div class="row"><b>Room ${r.code}</b><span>${r.players}/2</span></div>
    <div>Dealer: ${r.dealerName ?? '-'}</div>
    <button class="primary">Join</button>`;
    card.querySelector('button').addEventListener('click', () => {
      socket.emit('joinRoomByCode', { name: me.name, code: r.code });
    });
    wrap.appendChild(card);
  });
});

socket.on('connect', () => { me.id = socket.id; });
socket.on('lobby', () => { show('#lobby'); hide('#hud'); });
socket.on('joined', (payload) => {
  room = payload.room;
  hide('#lobby'); show('#hud');
  setText('#p1-name', payload.you.name || 'You');
  setText('#p2-name', payload.opp?.name || 'Opponent');
  setText('#p1-score', payload.scores?.[payload.you.id] ?? 0);
  setText('#p2-score', payload.scores?.[payload.opp?.id] ?? 0);
  setText('#status', 'Waiting for deal...');
});

socket.on('state', (s) => {
  // s: { you, opp, hand, legal, trick, scores, turn, canPlayDown, phase, message }
  hand = s.hand || [];
  legal = s.legal || [];
  isMyTurn = s.turn === s.you.id;
  setText('#p1-name', s.you.name || 'You');
  setText('#p2-name', s.opp?.name || 'Opponent');
  setText('#p1-score', s.scores[s.you.id] ?? 0);
  setText('#p2-score', s.scores[s.opp?.id] ?? 0);
  setText('#status', s.message || (isMyTurn ? 'Your turn' : 'Opponent turn'));

  // Render hand with legal highlighting
  layoutHand(handDiv, hand.map(c => ({...c, disabled: !legal.some(l => l.rank===c.rank && l.suit===c.suit)})), (i) => {
    if(!isMyTurn) return;
    const card = hand[i];
    const slot = s.trick?.lead ? document.getElementById('resp-slot') : document.getElementById('lead-slot');
    // animate ghost card
    const node = handDiv.children[i];
    node.classList.add('playing');
    animateToSlot(node, slot);
    playSfx(sfx.play);
    setTimeout(() => {
      socket.emit('play', { card });
    }, 680);
  });

  // Show trick slots (no history)
  leadSlot.innerHTML = '';
  respSlot.innerHTML = '';
  if(s.trick?.lead){
    leadSlot.appendChild(cardNode(s.trick.lead));
  }
  if(s.trick?.resp){
    respSlot.appendChild(cardNode(s.trick.resp));
  }
});

socket.on('roundResult', (r) => {
  // r: { breakdown:[{playerId,label,points}], totals:{id:score}, nextDealerName }
  const box = document.getElementById('round-breakdown');
  box.innerHTML = r.breakdown.map(b => `<div>${b.label}: <b>${b.points>0?'+':''}${b.points}</b></div>`).join('');
  show('#end-round');
  playSfx(sfx.score);
});

document.getElementById('btn-next-round')?.addEventListener('click', () => {
  hide('#end-round');
  socket.emit('nextDeal');
});

function cardNode(c){
  const d = document.createElement('div');
  d.className = 'card';
  const img = document.createElement('img');
  img.src = `https://deckofcardsapi.com/static/img/${c.rank==='10'?'0':c.rank[0]}${c.suit[0].toUpperCase()}.png`;
  d.appendChild(img);
  return d;
}

// Request initial rooms list
socket.emit('getRooms');
