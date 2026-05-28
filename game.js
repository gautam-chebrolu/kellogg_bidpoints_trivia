/**
 * BidTrivia — game.js
 * Pure vanilla JS: no frameworks, no external libraries.
 *
 * CSV CONFIGURATION
 * ─────────────────
 * Replace the column names below to match your actual CSV headers.
 * Then drop your CSV into data/kellogg_bid_stats.csv (or adjust DATA_PATH).
 * If running via file:// (double-click), the app falls back to
 * SAMPLE_DATA automatically. For live CSV loading, use a local server:
 *   python -m http.server 8080   →  http://localhost:8080
 */

const CONFIG = {
  DATA_PATH: 'data/kellogg_bid_stats.csv',

  // Map to your actual CSV column headers (kellogg_bid_stats.csv):
  COL_COURSE:  'Course Title',
  COL_TERM:    'Term',          // e.g. "Fall 2023" — parsed into quarter + year
  COL_PHASE:   'Phase',         // e.g. "Fall 2023 Bid Phase 1" — term prefix is stripped
  COL_BIDS:    'Number of Bids',
  COL_SEATS:   'Seats Available',
  COL_COST:    'Closing Cost',
  COL_FACULTY: 'Faculty',       // e.g. "Cast, Carter" — flipped to "Carter Cast"
  COL_CAMPUS:  'Campus',        // e.g. "Evanston", "Chicago"

  LIVES:        3,
  CARDS_PER_GAME: 15,
  MIN_COST_SPREAD: 5,   // min unique cost values needed to start
};

/* ═══════════════════════════════════════════════════
   SAMPLE DATA  (fallback when CSV can't be loaded)
   ═══════════════════════════════════════════════════ */
const SAMPLE_DATA = [
  { course:"Business and the Natural Environment", term:"Fall 2023", year:"2023", quarter:"Fall",   phase:"Bid Phase 1", professor:"Jane Smith",     campus:"Evanston", bids:22,  seats:40, cost:1   },
  { course:"Ethics and Corporate Responsibility",  term:"Fall 2022", year:"2022", quarter:"Fall",   phase:"Bid Phase 1", professor:"John Doe",       campus:"Evanston", bids:18,  seats:35, cost:1   },
  { course:"Management Communication",             term:"Fall 2023", year:"2023", quarter:"Fall",   phase:"Bid Phase 2", professor:"Alice Brown",    campus:"Chicago",  bids:12,  seats:30, cost:1   },
  { course:"Global Initiatives in Management",     term:"Spring 2023", year:"2023", quarter:"Spring", phase:"Bid Phase 2", professor:"Bob Chen",    campus:"Evanston", bids:15,  seats:45, cost:2   },
  { course:"Business Law",                         term:"Spring 2024", year:"2024", quarter:"Spring", phase:"Bid Phase 1", professor:"Mark McCareins", campus:"Evanston", bids:28,  seats:40, cost:8   },
  { course:"Health Industry Management",           term:"Fall 2021", year:"2021", quarter:"Fall",   phase:"Bid Phase 2", professor:"Carol White",    campus:"Chicago",  bids:20,  seats:35, cost:12  },
  { course:"Marketing Research",                   term:"Winter 2023", year:"2023", quarter:"Winter", phase:"Bid Phase 1", professor:"David Lee",   campus:"Evanston", bids:55,  seats:40, cost:18  },
  { course:"Social Enterprise at Kellogg",         term:"Fall 2023", year:"2023", quarter:"Fall",   phase:"Bid Phase 1", professor:"Emily Patel",   campus:"Evanston", bids:38,  seats:35, cost:25  },
  { course:"Entrepreneurship Lab",                 term:"Spring 2022", year:"2022", quarter:"Spring", phase:"Bid Phase 2", professor:"Frank Garcia", campus:"Evanston", bids:42,  seats:30, cost:30  },
  { course:"Digital Marketing",                    term:"Fall 2022", year:"2022", quarter:"Fall",   phase:"Bid Phase 1", professor:"Grace Kim",     campus:"Evanston", bids:88,  seats:60, cost:35  },
  { course:"Supply Chain Management",              term:"Winter 2024", year:"2024", quarter:"Winter", phase:"Bid Phase 1", professor:"Hank Jones",  campus:"Evanston", bids:65,  seats:50, cost:42  },
  { course:"Financial Statement Analysis",         term:"Fall 2020", year:"2020", quarter:"Fall",   phase:"Bid Phase 1", professor:"Ivy Nguyen",    campus:"Evanston", bids:72,  seats:55, cost:48  },
  { course:"Macroeconomic Policy",                 term:"Fall 2021", year:"2021", quarter:"Fall",   phase:"Bid Phase 1", professor:"Jack Turner",   campus:"Evanston", bids:55,  seats:50, cost:28  },
  { course:"Executive Compensation",               term:"Spring 2022", year:"2022", quarter:"Spring", phase:"Bid Phase 1", professor:"Kate Lin",   campus:"Evanston", bids:48,  seats:30, cost:38  },
  { course:"Design Thinking",                      term:"Winter 2024", year:"2024", quarter:"Winter", phase:"Bid Phase 1", professor:"Leo Adams",  campus:"Evanston", bids:95,  seats:40, cost:62  },
  { course:"Corporate Strategy",                   term:"Fall 2023", year:"2023", quarter:"Fall",   phase:"Bid Phase 1", professor:"Mia Scott",     campus:"Evanston", bids:90,  seats:55, cost:65  },
  { course:"Leadership in Organizations",          term:"Fall 2022", year:"2022", quarter:"Fall",   phase:"Bid Phase 1", professor:"Nate Brooks",   campus:"Evanston", bids:80,  seats:55, cost:55  },
  { course:"Media and Entertainment Strategy",     term:"Fall 2022", year:"2022", quarter:"Fall",   phase:"Bid Phase 1", professor:"Olivia Ray",    campus:"Chicago",  bids:98,  seats:40, cost:72  },
  { course:"Consumer Behavior",                    term:"Winter 2023", year:"2023", quarter:"Winter", phase:"Bid Phase 1", professor:"Paul Rivera", campus:"Evanston", bids:100, seats:60, cost:78  },
  { course:"Operations Management",                term:"Fall 2021", year:"2021", quarter:"Fall",   phase:"Bid Phase 1", professor:"Quinn Hall",    campus:"Evanston", bids:85,  seats:50, cost:88  },
  { course:"Sports Business",                      term:"Spring 2024", year:"2024", quarter:"Spring", phase:"Bid Phase 1", professor:"Rita Voss",  campus:"Evanston", bids:110, seats:40, cost:88  },
  { course:"Brand Management",                     term:"Spring 2024", year:"2024", quarter:"Spring", phase:"Bid Phase 1", professor:"Sam Ellis",  campus:"Evanston", bids:110, seats:55, cost:95  },
  { course:"Mergers and Acquisitions",             term:"Fall 2022", year:"2022", quarter:"Fall",   phase:"Bid Phase 1", professor:"Tina Wells",    campus:"Evanston", bids:125, seats:60, cost:112 },
  { course:"Pricing Strategies",                   term:"Winter 2022", year:"2022", quarter:"Winter", phase:"Bid Phase 1", professor:"Uma Patel",  campus:"Evanston", bids:95,  seats:50, cost:118 },
  { course:"Behavioral Finance",                   term:"Spring 2024", year:"2024", quarter:"Spring", phase:"Bid Phase 1", professor:"Vic Monroe", campus:"Evanston", bids:78,  seats:40, cost:132 },
  { course:"Data Science for Marketing",           term:"Winter 2024", year:"2024", quarter:"Winter", phase:"Bid Phase 1", professor:"Wendy Cho",  campus:"Evanston", bids:130, seats:55, cost:135 },
  { course:"Derivatives Markets",                  term:"Spring 2023", year:"2023", quarter:"Spring", phase:"Bid Phase 1", professor:"Xavier Ford", campus:"Evanston", bids:88,  seats:45, cost:142 },
  { course:"Technology Strategy",                  term:"Fall 2023", year:"2023", quarter:"Fall",   phase:"Bid Phase 1", professor:"Yara Singh",    campus:"Evanston", bids:122, seats:50, cost:148 },
  { course:"Fixed Income",                         term:"Spring 2023", year:"2023", quarter:"Spring", phase:"Bid Phase 1", professor:"Zane Black", campus:"Evanston", bids:68,  seats:35, cost:155 },
  { course:"Negotiations",                         term:"Fall 2023", year:"2023", quarter:"Fall",   phase:"Bid Phase 1", professor:"Ann Cooper",    campus:"Evanston", bids:145, seats:60, cost:158 },
  { course:"Real Estate Finance",                  term:"Winter 2023", year:"2023", quarter:"Winter", phase:"Bid Phase 1", professor:"Bill Drake", campus:"Evanston", bids:98,  seats:35, cost:178 },
  { course:"Corporate Finance Lab",                term:"Spring 2022", year:"2022", quarter:"Spring", phase:"Bid Phase 1", professor:"Clara Dunn", campus:"Evanston", bids:75,  seats:30, cost:195 },
  { course:"Innovation Lab",                       term:"Winter 2022", year:"2022", quarter:"Winter", phase:"Bid Phase 1", professor:"Dan Frost",  campus:"Evanston", bids:88,  seats:30, cost:195 },
  { course:"Financial Modeling",                   term:"Winter 2023", year:"2023", quarter:"Winter", phase:"Bid Phase 1", professor:"Ella Grant", campus:"Evanston", bids:105, seats:40, cost:188 },
  { course:"Investment Management",                term:"Fall 2023", year:"2023", quarter:"Fall",   phase:"Bid Phase 1", professor:"Fred Hale",     campus:"Evanston", bids:160, seats:55, cost:210 },
  { course:"Business Analytics",                   term:"Fall 2022", year:"2022", quarter:"Fall",   phase:"Bid Phase 1", professor:"Gina Irwin",    campus:"Evanston", bids:175, seats:60, cost:228 },
  { course:"Machine Learning for Finance",         term:"Spring 2023", year:"2023", quarter:"Spring", phase:"Bid Phase 1", professor:"Hugo James", campus:"Evanston", bids:115, seats:35, cost:235 },
  { course:"Organizational Change",                term:"Winter 2024", year:"2024", quarter:"Winter", phase:"Bid Phase 1", professor:"Iris Kent",  campus:"Evanston", bids:105, seats:40, cost:245 },
  { course:"Private Equity Finance",               term:"Fall 2022", year:"2022", quarter:"Fall",   phase:"Bid Phase 1", professor:"Jake Lowe",     campus:"Evanston", bids:130, seats:30, cost:268 },
  { course:"Trading and Markets",                  term:"Spring 2024", year:"2024", quarter:"Spring", phase:"Bid Phase 1", professor:"Kim Nash",   campus:"Evanston", bids:115, seats:35, cost:290 },
  { course:"Venture Capital Lab",                  term:"Winter 2022", year:"2022", quarter:"Winter", phase:"Bid Phase 1", professor:"Liam Owen",  campus:"Evanston", bids:88,  seats:25, cost:315 },
  { course:"Distressed Investing",                 term:"Fall 2021", year:"2021", quarter:"Fall",   phase:"Bid Phase 1", professor:"Mary Price",    campus:"Evanston", bids:75,  seats:20, cost:390 },
  { course:"Hedge Funds & Alt Investments",        term:"Winter 2023", year:"2023", quarter:"Winter", phase:"Bid Phase 1", professor:"Nick Quinn", campus:"Evanston", bids:92,  seats:30, cost:342 },
  { course:"Startup Lab",                          term:"Fall 2023", year:"2023", quarter:"Fall",   phase:"Bid Phase 1", professor:"Opal Reed",     campus:"Evanston", bids:145, seats:28, cost:378 },
  { course:"Investment Banking Lab",               term:"Fall 2022", year:"2022", quarter:"Fall",   phase:"Bid Phase 1", professor:"Pete Shaw",     campus:"Evanston", bids:120, seats:25, cost:405 },
  { course:"Private Equity Lab",                   term:"Winter 2024", year:"2024", quarter:"Winter", phase:"Bid Phase 1", professor:"Rose Todd",  campus:"Evanston", bids:150, seats:22, cost:448 },
];

/* ═══════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════ */
let state = {
  allData:     [],
  deck:        [],    // cards for this game session
  timeline:    [],    // placed cards (sorted by cost)
  cardIndex:   0,     // next card to show from deck
  lives:       CONFIG.LIVES,
  score:       0,
  streak:      0,
  bestStreak:  0,
  cardsAttempted: 0,
  isAnimating: false,
  dragging:    false,
  clickMode:   false, // true = card is "picked up", waiting for slot click
};

/* ═══════════════════════════════════════════════════
   CSV PARSING
   ═══════════════════════════════════════════════════ */


function mapCSVRow(row) {
  const cost = parseFloat(row[CONFIG.COL_COST]);
  // Skip rows with no closing cost (un-bid or free sections)
  if (isNaN(cost) || cost <= 0) return null;

  // Term is "Fall 2023", "Winter 2024", etc. — split into quarter + year
  const termRaw  = (row[CONFIG.COL_TERM] || '').trim();
  const termMatch = termRaw.match(/^(\S+)\s+(\d{4})$/);
  const quarter  = termMatch ? termMatch[1] : termRaw;
  const year     = termMatch ? termMatch[2] : '';

  // Phase is "Fall 2023 Bid Phase 1" — strip the leading "<Term> " prefix
  const phaseRaw = (row[CONFIG.COL_PHASE] || '').trim();
  const phase    = phaseRaw.startsWith(termRaw)
    ? phaseRaw.slice(termRaw.length).trim()
    : phaseRaw;

  // Faculty is "Last, First" — flip to "First Last"
  const facultyRaw = (row[CONFIG.COL_FACULTY] || '').trim();
  let professor = facultyRaw;
  if (facultyRaw.includes(',')) {
    const parts = facultyRaw.split(',').map(s => s.trim());
    professor = parts[1] + ' ' + parts[0];  // "First Last"
  }

  // Campus
  const campus = (row[CONFIG.COL_CAMPUS] || '').trim();

  return {
    course:  row[CONFIG.COL_COURSE]  || 'Unknown',
    term:    termRaw,   // combined "Fall 2023" for display
    year,
    quarter,
    phase,
    professor,
    campus,
    bids:    parseInt(row[CONFIG.COL_BIDS])  || 0,
    seats:   parseInt(row[CONFIG.COL_SEATS]) || 0,
    cost,
  };
}

async function loadData() {
  try {
    if (typeof KELLOGG_BID_STATS !== 'undefined') {
      const mapped = KELLOGG_BID_STATS.map(mapCSVRow).filter(Boolean);
      if (mapped.length >= CONFIG.MIN_COST_SPREAD) {
        state.allData = mapped;
        showToast('Loaded ' + mapped.length + ' courses from JS data', 'info');
        return;
      }
    }
  } catch (_) { /* fall through */ }
  // Fallback to sample data
  state.allData = SAMPLE_DATA;
  showToast('Using built-in sample data', 'info');
}

/* ═══════════════════════════════════════════════════
   GAME LOGIC
   ═══════════════════════════════════════════════════ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  const shuffled = shuffle(state.allData);
  return shuffled.slice(0, Math.min(CONFIG.CARDS_PER_GAME, shuffled.length));
}

async function startGame() {
  // Show/hide screens
  document.getElementById('start-screen').classList.remove('active');
  document.getElementById('gameover-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');

  if (state.allData.length === 0) {
    await loadData();
  }

  // Reset state
  const deck = buildDeck();
  state.deck        = deck.slice(1); // remaining cards
  state.timeline    = [deck[0]];     // anchor — first card placed automatically
  state.cardIndex   = 0;
  state.lives       = CONFIG.LIVES;
  state.score       = 0;
  state.streak      = 0;
  state.bestStreak  = 0;
  state.cardsAttempted = 0;
  state.isAnimating = false;
  state.clickMode   = false;

  renderAll();
  scrollTimelineToCenter();
}

function goHome() {
  document.getElementById('gameover-screen').classList.remove('active');
  document.getElementById('game-screen').classList.remove('active');
  document.getElementById('start-screen').classList.add('active');
}

function activeCard() {
  return state.deck[state.cardIndex] || null;
}

/** Returns true if slotIndex is a valid position for cost in the current timeline */
function isCorrectPlacement(slotIndex, cost) {
  const tl = state.timeline;
  const leftCost  = slotIndex > 0           ? tl[slotIndex - 1].cost : -Infinity;
  const rightCost = slotIndex < tl.length   ? tl[slotIndex].cost     :  Infinity;
  return leftCost <= cost && cost <= rightCost;
}

/** Find the correct slot index for a given cost in the current timeline */
function findCorrectSlot(cost) {
  const tl = state.timeline;
  for (let i = 0; i <= tl.length; i++) {
    const left  = i > 0          ? tl[i - 1].cost : -Infinity;
    const right = i < tl.length  ? tl[i].cost     :  Infinity;
    if (left <= cost && cost <= right) return i;
  }
  return tl.length;
}

function insertIntoTimeline(card, slotIndex) {
  state.timeline.splice(slotIndex, 0, card);
}

async function handlePlacement(slotIndex) {
  if (state.isAnimating) return;
  const card = activeCard();
  if (!card) return;

  state.isAnimating = true;
  state.cardsAttempted++;

  // Exit click mode
  if (state.clickMode) {
    state.clickMode = false;
    document.getElementById('active-card').classList.remove('card--picked');
  }

  const correct = isCorrectPlacement(slotIndex, card.cost);

  if (correct) {
    // ── Correct ──
    state.score++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    insertIntoTimeline(card, slotIndex);
    renderTimeline();
    renderStats();
    // Highlight the newly placed card
    const placed = document.querySelectorAll('.card--placed');
    const newCard = placed[slotIndex];
    if (newCard) newCard.classList.add('card--correct');
    showToast(streakMessage(state.streak), 'correct');
    await delay(500);
    if (newCard) newCard.classList.remove('card--correct');
    advanceCard();
  } else {
    // ── Wrong ──
    state.lives--;
    state.streak = 0;
    renderStats();
    // Shake the active card
    const ac = document.getElementById('active-card');
    ac.classList.add('shake');
    ac.style.animation = 'none'; // pause pulse briefly
    setTimeout(() => {
      ac.classList.remove('shake');
      ac.style.animation = '';
    }, 600);
    // Find and show correct position
    const correctSlot = findCorrectSlot(card.cost);
    insertIntoTimeline(card, correctSlot);
    renderTimeline();
    const placed = document.querySelectorAll('.card--placed');
    const wrongCard = placed[correctSlot];
    if (wrongCard) wrongCard.classList.add('card--wrong');
    showToast(`❌ It cost ${card.cost} pts — placing it correctly`, 'wrong');
    await delay(1500);
    if (wrongCard) wrongCard.classList.remove('card--wrong');

    if (state.lives <= 0) {
      await delay(400);
      showGameOver();
      return;
    }
    advanceCard();
  }

  state.isAnimating = false;
}

function advanceCard() {
  state.cardIndex++;
  if (state.cardIndex >= state.deck.length) {
    // Deck exhausted — game won!
    showGameOver(true);
    return;
  }
  renderActiveCard();
  renderProgress();
  scrollTimelineToCenter();
}

function streakMessage(streak) {
  if (streak >= 10) return `🔥 ${streak} streak!! Unreal!`;
  if (streak >= 7)  return `🔥 ${streak} in a row! On fire!`;
  if (streak >= 5)  return `🔥 ${streak} in a row!`;
  if (streak >= 3)  return `✅ ${streak} streak!`;
  return '✅ Correct!';
}

function showGameOver(won = false) {
  document.getElementById('game-screen').classList.remove('active');
  const screen = document.getElementById('gameover-screen');
  screen.classList.add('active');

  document.getElementById('gameover-emoji').textContent = won ? '🏆' : '💀';
  document.getElementById('gameover-title').textContent = won ? 'Deck Complete!' : 'Game Over';
  document.getElementById('gameover-sub').textContent =
    won
      ? `You placed all ${state.score} cards correctly!`
      : `You placed ${state.score} out of ${state.cardsAttempted - 1} correctly.`;

  document.getElementById('final-score').textContent   = state.score;
  document.getElementById('final-streak').textContent  = state.bestStreak;
  document.getElementById('final-cards').textContent   = state.cardsAttempted;

  const accuracy = state.cardsAttempted > 0
    ? Math.round((state.score / state.cardsAttempted) * 100) : 0;
  document.getElementById('final-accuracy').textContent = accuracy + '%';

  // Animate ring
  const circumference = 327;
  const progress = state.cardsAttempted > 0
    ? state.score / state.cardsAttempted : 0;
  const dash = circumference * (1 - progress);
  setTimeout(() => {
    document.getElementById('ring-fill').style.strokeDashoffset = dash;
  }, 100);
}

/* ═══════════════════════════════════════════════════
   RENDERING
   ═══════════════════════════════════════════════════ */
function renderAll() {
  renderLives();
  renderStats();
  renderActiveCard();
  renderTimeline();
  renderProgress();
}

function renderLives() {
  const el = document.getElementById('lives-display');
  el.innerHTML = '';
  for (let i = 0; i < CONFIG.LIVES; i++) {
    const span = document.createElement('span');
    span.className = 'life' + (i >= state.lives ? ' lost' : '');
    span.textContent = '❤️';
    el.appendChild(span);
  }
}

function renderStats() {
  document.getElementById('streak-display').textContent = state.streak;
  document.getElementById('score-display').textContent  = state.score;
  renderLives();
}

function renderProgress() {
  const total   = state.deck.length;
  const current = state.cardIndex + 1;
  document.getElementById('progress-text').textContent =
    `Card ${Math.min(current, total)} of ${total}`;
}

function renderActiveCard() {
  const card = activeCard();
  if (!card) return;
  document.getElementById('active-course').textContent    = card.course;
  document.getElementById('active-professor').textContent = card.professor || '';
  document.getElementById('active-campus').textContent    = card.campus || '';
  // Combine term and phase on one line
  const termPhase = [card.term, card.phase].filter(Boolean).join(' · ');
  document.getElementById('active-term-phase').textContent = termPhase;
  document.getElementById('active-bids').textContent      = card.bids.toLocaleString();
  document.getElementById('active-seats').textContent     = card.seats.toLocaleString();
}

function phaseBadgeClass(phase) {
  if (!phase) return '';
  const lower = phase.toLowerCase();
  if (lower.includes('1')) return 'badge-r1';
  if (lower.includes('2')) return 'badge-r2';
  return '';
}

function renderTimeline() {
  const tl = document.getElementById('timeline');
  tl.innerHTML = '';
  const sorted = state.timeline; // already sorted (we always insert correctly)

  for (let i = 0; i <= sorted.length; i++) {
    // Drop slot
    const slot = createSlot(i);
    tl.appendChild(slot);

    // Placed card
    if (i < sorted.length) {
      const cardEl = createPlacedCard(sorted[i]);
      tl.appendChild(cardEl);
    }
  }
}

function createSlot(index) {
  const slot = document.createElement('div');
  slot.className = 'slot';
  slot.dataset.slot = index;
  slot.id = 'slot-' + index;

  const inner = document.createElement('div');
  inner.className = 'slot-inner';
  slot.appendChild(inner);

  // Click handler
  slot.addEventListener('click', () => handlePlacement(index));

  // Drag events
  slot.addEventListener('dragover', (e) => {
    e.preventDefault();
    slot.classList.add('drag-over');
  });
  slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
  slot.addEventListener('drop', (e) => {
    e.preventDefault();
    slot.classList.remove('drag-over');
    handlePlacement(index);
  });

  return slot;
}

function createPlacedCard(card) {
  const el = document.createElement('div');
  el.className = 'card card--placed';

  const termPhase = [card.term, card.phase].filter(Boolean).join(' · ');
  el.innerHTML = `
    <div class="card-course-name">${card.course}</div>
    ${card.professor ? `<div class="card-professor">${card.professor}</div>` : ''}
    ${card.campus ? `<div class="card-campus">${card.campus}</div>` : ''}
    <div class="card-term-phase">${termPhase}</div>
    <div class="cost-reveal">
      <div class="cost-reveal-label">Cost</div>
      <div class="cost-reveal-value">${card.cost.toLocaleString()} pts</div>
    </div>
  `;
  return el;
}

/* ═══════════════════════════════════════════════════
   DRAG & DROP  (desktop)
   ═══════════════════════════════════════════════════ */
function initDragDrop() {
  const ac = document.getElementById('active-card');

  ac.addEventListener('dragstart', (e) => {
    state.dragging = true;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => ac.style.opacity = '0.5', 0);
  });

  ac.addEventListener('dragend', () => {
    state.dragging = false;
    ac.style.opacity = '';
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over'));
  });

  // Click-to-pick-up for mobile / keyboard
  ac.addEventListener('click', () => {
    if (state.isAnimating) return;
    state.clickMode = !state.clickMode;
    ac.classList.toggle('card--picked', state.clickMode);
    if (state.clickMode) {
      showToast('Now tap a slot on the timeline ↓', 'info');
    }
  });
}

/* ═══════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════ */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let toastTimer = null;
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function scrollTimelineToCenter() {
  const wrap = document.getElementById('timeline-scroll-wrap');
  if (!wrap) return;
  setTimeout(() => {
    wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2;
  }, 100);
}

/* ═══════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initDragDrop();
});
