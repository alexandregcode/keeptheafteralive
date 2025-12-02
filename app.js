let pools = {
  wouldYouRather: [],
  tellAStory: [],
  hotTakeSubjects: []
};

const landing = document.getElementById('landing');
const viewport = document.getElementById('viewport');

const TEXT_PALETTE = [
  'var(--white)',
  'var(--accent)',
  '#bdbdbd', /* muted grey */
  '#9ff8e6', /* pale cyan */
  '#eac2ff', /* soft lavender */
  '#9ad1ff', /* icy blue */
  '#b7ffd9', /* mint */
  '#ffc8a2', /* warm sand */
  '#ff9fb3', /* dusty pink */
  '#c7c7ff', /* soft periwinkle */
  '#8c8c8c'  /* deep grey */
];

let historyStack = []; // generated cards
let historyIndex = -1;  // -1 = landing

function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function genRandomCard() {
  // pick category randomly (weights can be adjusted)
  const rnd = Math.random();
   // would-you-rather branch (pick from good OR bad pool only)
  if (rnd < 0.45) {
    // choose whether to use the 'good' or 'bad' pool (50/50)
    const useGood = Math.random() < 0.5;
    const pool = useGood ? pools.wouldYouRatherGood : pools.wouldYouRatherBad;
    if (pool.length >= 2) {
      let i = Math.floor(Math.random() * pool.length);
      let j = Math.floor(Math.random() * pool.length);
      while (j === i) j = Math.floor(Math.random() * pool.length);
      const left = pool[i];
      const right = pool[j];
      return {
        type: 'would-you-rather',
        title: 'Would you rather',
        text: `${left}\n\n— or —\n\n${right}`
      };
    }
  } else if (rnd < 0.80 && pools.tellAStory.length > 0) {
    const pool = pools.tellAStory;
    const idx = Math.floor(Math.random() * pool.length);
    return {
      type: 'tell-a-story',
      title: 'Tell a story',
      text: pool[idx]
    };
  } else {
    const pool = pools.hotTakeSubjects;
    if (!pool.length) return { type: 'hot-take', title: 'Hot take', text: '' };
    const idx = Math.floor(Math.random() * pool.length);
    return {
      type: 'hot-take',
      title: 'Hot take',
      text: `about ${pool[idx]}`
    };
  }
}

function renderCardObj(card, direction = 0) {
  landing.setAttribute('aria-hidden', 'true');
  viewport.setAttribute('aria-hidden', 'false');
  viewport.innerHTML = '';

  // escape user text, then convert newlines to <br>
  const textHtml = escapeHtml(card.text).replaceAll('\n', '<br>');

  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="type">${escapeHtml(card.type)}</div>
    <div class="text">${textHtml}</div>
  `;

  // persist a random colour for the card so history shows the same colour
  if (!card.color) {
    card.color = TEXT_PALETTE[Math.floor(Math.random() * TEXT_PALETTE.length)];
  }

  // apply the random colour to the main text only
  const textEl = el.querySelector('.text');
  if (textEl) textEl.style.color = card.color;

  if (direction === 1) { el.style.transform = 'translateY(32px)'; el.style.opacity = '0'; }
  if (direction === -1) { el.style.transform = 'translateY(-32px)'; el.style.opacity = '0'; }

  viewport.appendChild(el);
  requestAnimationFrame(()=> { el.style.transform = 'translateY(0)'; el.style.opacity = '1'; });

  attachSwipe(el);
}

function pushNext() {
  // if we're not at the end of history, move forward in history
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    renderCardObj(historyStack[historyIndex], 1);
    return;
  }
  // otherwise generate new card and push
  const card = genRandomCard();
  historyStack.push(card);
  historyIndex = historyStack.length - 1;
  renderCardObj(card, 1);
}

function goPrev() {
  if (historyIndex <= 0) { showLanding(); return; }
  historyIndex--;
  renderCardObj(historyStack[historyIndex], -1);
}

function showLanding() {
  historyIndex = -1;
  landing.setAttribute('aria-hidden', 'false');
  viewport.setAttribute('aria-hidden', 'true');
  viewport.innerHTML = '';
  // small arrow pulse handled in CSS on landing show elsewhere
}

function next() { pushNext(); }
function prev() { goPrev(); }

function attachSwipe(el) {
  let startY = 0, curY = 0, dragging = false;
  function start(e) { dragging = true; startY = e.touches ? e.touches[0].clientY : e.clientY; el.style.transition = 'none'; }
  function move(e) { if(!dragging) return; curY = e.touches ? e.touches[0].clientY : e.clientY; const d = curY - startY; el.style.transform = `translateY(${d}px)`; el.style.opacity = Math.max(0.35, 1 - Math.abs(d)/200); }
  function end() { if(!dragging) return; dragging = false; const d = curY - startY; el.style.transition = ''; if(d < -60) { el.style.transform='translateY(-200px)'; el.style.opacity='0'; setTimeout(next, 100); } else if(d > 60) { el.style.transform='translateY(200px)'; el.style.opacity='0'; setTimeout(prev, 100); } else { el.style.transform='translateY(0)'; el.style.opacity='1'; } startY = curY = 0; }

  el.addEventListener('touchstart', start, {passive:true});
  el.addEventListener('touchmove', move, {passive:true});
  el.addEventListener('touchend', end);
  el.addEventListener('mousedown', (e)=>{ e.preventDefault(); start(e); window.addEventListener('mousemove', move); window.addEventListener('mouseup', function up(){ end(); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }); });
}

// landing swipe/tap
function attachLandingSwipe() {
  let startY = 0, curY = 0, dragging = false;
  function start(e){ dragging = true; startY = e.touches ? e.touches[0].clientY : e.clientY; }
  function move(e){ if(!dragging) return; curY = e.touches ? e.touches[0].clientY : e.clientY; }
  function end(){ if(!dragging) return; dragging=false; const d = curY - startY; if(d < -60) next(); startY = curY = 0; }
  landing.addEventListener('touchstart', start, {passive:true});
  landing.addEventListener('touchmove', move, {passive:true});
  landing.addEventListener('touchend', end);
}

// keyboard
window.addEventListener('keydown', e => { if(e.code === 'ArrowUp') prev(); if(e.code === 'ArrowDown' || e.code === 'Space') next(); });

// load pools
fetch('./topics.json')
  .then(r => r.ok ? r.json() : Promise.reject(r.status))
  .then(data => {
    pools.wouldYouRatherGood = Array.isArray(data.wouldYouRatherGood) ? data.wouldYouRatherGood : [];
    pools.wouldYouRatherBad = Array.isArray(data.wouldYouRatherBad) ? data.wouldYouRatherBad : [];
    pools.tellAStory = Array.isArray(data.tellAStory) ? data.tellAStory : [];
    pools.hotTakeSubjects = Array.isArray(data.hotTakeSubjects) ? data.hotTakeSubjects : [];
    attachLandingSwipe();
    showLanding();
  })
  .catch(err => {
    console.error('Failed to load topics.json', err);
    // fallback to inline minimal pools to keep app usable
    pools.wouldYouRather = ["dance without shoes","only play vinyl","never sleep"].slice();
    pools.tellAStory = ["Tell about your first sunrise set."];
    pools.hotTakeSubjects = ["vinyl-only nights"];
    attachLandingSwipe();
    showLanding();
  });

const brand = document.querySelector('.brand');

let longPressTimer = null;
const LONG_PRESS_TIME = 500; // ms to trigger long press
let isLongPressing = false;

// --- TOUCH START ---
brand.addEventListener('touchstart', (e) => {
  // isolate this element from swipe logic
  e.stopPropagation();

  isLongPressing = false;

  longPressTimer = setTimeout(() => {
    longPressTimer = null;
    isLongPressing = true;
    onLongPress();
  }, LONG_PRESS_TIME);
}, { passive: true });

// --- TOUCH MOVE ---
brand.addEventListener('touchmove', (e) => {
  // Finger is sliding — cancel long press
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  // Prevent swipe from even starting
  e.stopPropagation();
}, { passive: true });

// --- TOUCH END ---
brand.addEventListener('touchend', (e) => {
  // stop swipe from triggering if this ended on brand
  e.stopPropagation();

  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}, { passive: true });

function onLongPress() {
  // 🔥 YOUR LONG-PRESS ACTION HERE
  window.open('https://www.google.com', '_blank');
}
