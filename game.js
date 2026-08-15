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
  COL_COURSE: 'Course Title',
  COL_TERM: 'Term',          // e.g. "Fall 2023" — parsed into quarter + year
  COL_PHASE: 'Phase',         // e.g. "Fall 2023 Bid Phase 1" — term prefix is stripped
  COL_BIDS: 'Number of Bids',
  COL_SEATS: 'Seats Available',
  COL_COST: 'Closing Cost',
  COL_FACULTY: 'Faculty',       // e.g. "Cast, Carter" — flipped to "Carter Cast"
  COL_CAMPUS: 'Campus',        // e.g. "Evanston", "Chicago"

  LIVES: 3,
  CARDS_PER_GAME: 15,
  MIN_COST_SPREAD: 5,   // min unique cost values needed to start

  // ── Leaderboard settings ──────────────────────────────────────────────────
  // Set to true to show only each player's best score on the leaderboard.
  // Currently false — all game entries are shown independently.
  // Flip to true when ready to enable deduplication.
  DEDUPLICATE_BY_NAME: false,

  LB_TOP_N: 10,   // number of entries to show per period
};

/* ═══════════════════════════════════════════════════
   LOCAL STORAGE KEYS
   ═══════════════════════════════════════════════════ */
const LS_ALLTIME_BEST = 'bidtrivia_alltime_best_streak';
const LS_LAST_STREAK = 'bidtrivia_last_streak';

/* ═══════════════════════════════════════════════════
   SAMPLE DATA  (fallback when CSV can't be loaded)
   ═══════════════════════════════════════════════════ */
const SAMPLE_DATA = [
  { course: "Business and the Natural Environment", term: "Fall 2023", year: "2023", quarter: "Fall", phase: "Bid Phase 1", professor: "Jane Smith", campus: "Evanston", bids: 22, seats: 40, cost: 1 },
  { course: "Ethics and Corporate Responsibility", term: "Fall 2022", year: "2022", quarter: "Fall", phase: "Bid Phase 1", professor: "John Doe", campus: "Evanston", bids: 18, seats: 35, cost: 1 },
  { course: "Management Communication", term: "Fall 2023", year: "2023", quarter: "Fall", phase: "Bid Phase 2", professor: "Alice Brown", campus: "Chicago", bids: 12, seats: 30, cost: 1 },
  { course: "Global Initiatives in Management", term: "Spring 2023", year: "2023", quarter: "Spring", phase: "Bid Phase 2", professor: "Bob Chen", campus: "Evanston", bids: 15, seats: 45, cost: 2 },
  { course: "Business Law", term: "Spring 2024", year: "2024", quarter: "Spring", phase: "Bid Phase 1", professor: "Mark McCareins", campus: "Evanston", bids: 28, seats: 40, cost: 8 },
  { course: "Health Industry Management", term: "Fall 2021", year: "2021", quarter: "Fall", phase: "Bid Phase 2", professor: "Carol White", campus: "Chicago", bids: 20, seats: 35, cost: 12 },
  { course: "Marketing Research", term: "Winter 2023", year: "2023", quarter: "Winter", phase: "Bid Phase 1", professor: "David Lee", campus: "Evanston", bids: 55, seats: 40, cost: 18 },
  { course: "Social Enterprise at Kellogg", term: "Fall 2023", year: "2023", quarter: "Fall", phase: "Bid Phase 1", professor: "Emily Patel", campus: "Evanston", bids: 38, seats: 35, cost: 25 },
  { course: "Entrepreneurship Lab", term: "Spring 2022", year: "2022", quarter: "Spring", phase: "Bid Phase 2", professor: "Frank Garcia", campus: "Evanston", bids: 42, seats: 30, cost: 30 },
  { course: "Digital Marketing", term: "Fall 2022", year: "2022", quarter: "Fall", phase: "Bid Phase 1", professor: "Grace Kim", campus: "Evanston", bids: 88, seats: 60, cost: 35 },
  { course: "Supply Chain Management", term: "Winter 2024", year: "2024", quarter: "Winter", phase: "Bid Phase 1", professor: "Hank Jones", campus: "Evanston", bids: 65, seats: 50, cost: 42 },
  { course: "Financial Statement Analysis", term: "Fall 2020", year: "2020", quarter: "Fall", phase: "Bid Phase 1", professor: "Ivy Nguyen", campus: "Evanston", bids: 72, seats: 55, cost: 48 },
  { course: "Macroeconomic Policy", term: "Fall 2021", year: "2021", quarter: "Fall", phase: "Bid Phase 1", professor: "Jack Turner", campus: "Evanston", bids: 55, seats: 50, cost: 28 },
  { course: "Executive Compensation", term: "Spring 2022", year: "2022", quarter: "Spring", phase: "Bid Phase 1", professor: "Kate Lin", campus: "Evanston", bids: 48, seats: 30, cost: 38 },
  { course: "Design Thinking", term: "Winter 2024", year: "2024", quarter: "Winter", phase: "Bid Phase 1", professor: "Leo Adams", campus: "Evanston", bids: 95, seats: 40, cost: 62 },
  { course: "Corporate Strategy", term: "Fall 2023", year: "2023", quarter: "Fall", phase: "Bid Phase 1", professor: "Mia Scott", campus: "Evanston", bids: 90, seats: 55, cost: 65 },
  { course: "Leadership in Organizations", term: "Fall 2022", year: "2022", quarter: "Fall", phase: "Bid Phase 1", professor: "Nate Brooks", campus: "Evanston", bids: 80, seats: 55, cost: 55 },
  { course: "Media and Entertainment Strategy", term: "Fall 2022", year: "2022", quarter: "Fall", phase: "Bid Phase 1", professor: "Olivia Ray", campus: "Chicago", bids: 98, seats: 40, cost: 72 },
  { course: "Consumer Behavior", term: "Winter 2023", year: "2023", quarter: "Winter", phase: "Bid Phase 1", professor: "Paul Rivera", campus: "Evanston", bids: 100, seats: 60, cost: 78 },
  { course: "Operations Management", term: "Fall 2021", year: "2021", quarter: "Fall", phase: "Bid Phase 1", professor: "Quinn Hall", campus: "Evanston", bids: 85, seats: 50, cost: 88 },
  { course: "Sports Business", term: "Spring 2024", year: "2024", quarter: "Spring", phase: "Bid Phase 1", professor: "Rita Voss", campus: "Evanston", bids: 110, seats: 40, cost: 88 },
  { course: "Brand Management", term: "Spring 2024", year: "2024", quarter: "Spring", phase: "Bid Phase 1", professor: "Sam Ellis", campus: "Evanston", bids: 110, seats: 55, cost: 95 },
  { course: "Mergers and Acquisitions", term: "Fall 2022", year: "2022", quarter: "Fall", phase: "Bid Phase 1", professor: "Tina Wells", campus: "Evanston", bids: 125, seats: 60, cost: 112 },
  { course: "Pricing Strategies", term: "Winter 2022", year: "2022", quarter: "Winter", phase: "Bid Phase 1", professor: "Uma Patel", campus: "Evanston", bids: 95, seats: 50, cost: 118 },
  { course: "Behavioral Finance", term: "Spring 2024", year: "2024", quarter: "Spring", phase: "Bid Phase 1", professor: "Vic Monroe", campus: "Evanston", bids: 78, seats: 40, cost: 132 },
  { course: "Data Science for Marketing", term: "Winter 2024", year: "2024", quarter: "Winter", phase: "Bid Phase 1", professor: "Wendy Cho", campus: "Evanston", bids: 130, seats: 55, cost: 135 },
  { course: "Derivatives Markets", term: "Spring 2023", year: "2023", quarter: "Spring", phase: "Bid Phase 1", professor: "Xavier Ford", campus: "Evanston", bids: 88, seats: 45, cost: 142 },
  { course: "Technology Strategy", term: "Fall 2023", year: "2023", quarter: "Fall", phase: "Bid Phase 1", professor: "Yara Singh", campus: "Evanston", bids: 122, seats: 50, cost: 148 },
  { course: "Fixed Income", term: "Spring 2023", year: "2023", quarter: "Spring", phase: "Bid Phase 1", professor: "Zane Black", campus: "Evanston", bids: 68, seats: 35, cost: 155 },
  { course: "Negotiations", term: "Fall 2023", year: "2023", quarter: "Fall", phase: "Bid Phase 1", professor: "Ann Cooper", campus: "Evanston", bids: 145, seats: 60, cost: 158 },
  { course: "Real Estate Finance", term: "Winter 2023", year: "2023", quarter: "Winter", phase: "Bid Phase 1", professor: "Bill Drake", campus: "Evanston", bids: 98, seats: 35, cost: 178 },
  { course: "Corporate Finance Lab", term: "Spring 2022", year: "2022", quarter: "Spring", phase: "Bid Phase 1", professor: "Clara Dunn", campus: "Evanston", bids: 75, seats: 30, cost: 195 },
  { course: "Innovation Lab", term: "Winter 2022", year: "2022", quarter: "Winter", phase: "Bid Phase 1", professor: "Dan Frost", campus: "Evanston", bids: 88, seats: 30, cost: 195 },
  { course: "Financial Modeling", term: "Winter 2023", year: "2023", quarter: "Winter", phase: "Bid Phase 1", professor: "Ella Grant", campus: "Evanston", bids: 105, seats: 40, cost: 188 },
  { course: "Investment Management", term: "Fall 2023", year: "2023", quarter: "Fall", phase: "Bid Phase 1", professor: "Fred Hale", campus: "Evanston", bids: 160, seats: 55, cost: 210 },
  { course: "Business Analytics", term: "Fall 2022", year: "2022", quarter: "Fall", phase: "Bid Phase 1", professor: "Gina Irwin", campus: "Evanston", bids: 175, seats: 60, cost: 228 },
  { course: "Machine Learning for Finance", term: "Spring 2023", year: "2023", quarter: "Spring", phase: "Bid Phase 1", professor: "Hugo James", campus: "Evanston", bids: 115, seats: 35, cost: 235 },
  { course: "Organizational Change", term: "Winter 2024", year: "2024", quarter: "Winter", phase: "Bid Phase 1", professor: "Iris Kent", campus: "Evanston", bids: 105, seats: 40, cost: 245 },
  { course: "Private Equity Finance", term: "Fall 2022", year: "2022", quarter: "Fall", phase: "Bid Phase 1", professor: "Jake Lowe", campus: "Evanston", bids: 130, seats: 30, cost: 268 },
  { course: "Trading and Markets", term: "Spring 2024", year: "2024", quarter: "Spring", phase: "Bid Phase 1", professor: "Kim Nash", campus: "Evanston", bids: 115, seats: 35, cost: 290 },
  { course: "Venture Capital Lab", term: "Winter 2022", year: "2022", quarter: "Winter", phase: "Bid Phase 1", professor: "Liam Owen", campus: "Evanston", bids: 88, seats: 25, cost: 315 },
  { course: "Distressed Investing", term: "Fall 2021", year: "2021", quarter: "Fall", phase: "Bid Phase 1", professor: "Mary Price", campus: "Evanston", bids: 75, seats: 20, cost: 390 },
  { course: "Hedge Funds & Alt Investments", term: "Winter 2023", year: "2023", quarter: "Winter", phase: "Bid Phase 1", professor: "Nick Quinn", campus: "Evanston", bids: 92, seats: 30, cost: 342 },
  { course: "Startup Lab", term: "Fall 2023", year: "2023", quarter: "Fall", phase: "Bid Phase 1", professor: "Opal Reed", campus: "Evanston", bids: 145, seats: 28, cost: 378 },
  { course: "Investment Banking Lab", term: "Fall 2022", year: "2022", quarter: "Fall", phase: "Bid Phase 1", professor: "Pete Shaw", campus: "Evanston", bids: 120, seats: 25, cost: 405 },
  { course: "Private Equity Lab", term: "Winter 2024", year: "2024", quarter: "Winter", phase: "Bid Phase 1", professor: "Rose Todd", campus: "Evanston", bids: 150, seats: 22, cost: 448 },
];

/* ═══════════════════════════════════════════════════
   FIREBASE INIT
   ═══════════════════════════════════════════════════ */
let db = null;

function initFirebase() {
  try {
    if (typeof window.FIREBASE_CONFIG === 'undefined') {
      console.warn('BidTrivia: firebase-config.js not found — leaderboard disabled.');
      return;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(window.FIREBASE_CONFIG);
    }
    db = firebase.firestore();
  } catch (e) {
    console.warn('BidTrivia: Firebase init failed —', e.message);
  }
}

/* ═══════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════ */
let state = {
  allData: [],
  deck: [],    // cards for this game session
  timeline: [],    // placed cards (sorted by cost)
  cardIndex: 0,     // next card to show from deck
  lives: CONFIG.LIVES,
  score: 0,
  streak: 0,
  bestStreak: 0,
  cardsAttempted: 0,
  isAnimating: false,
  dragging: false,
  clickMode: false, // true = card is "picked up", waiting for slot click

  // Leaderboard / session tracking
  gameStartTime: null,  // Date object set when game starts
  activeDocRef: null,   // Firestore DocumentReference for the current game
  scoreSubmitted: false, // prevent double-submit
  activeLbPeriod: 'week',
};

/* ═══════════════════════════════════════════════════
   MEETING PATTERN PARSER
   ═══════════════════════════════════════════════════ */

/**
 * Parse the "Meeting Pattern" field from the Kellogg bid data into a compact
 * human-readable schedule string like "Tue 6:30–9:30" or "Mon / Thu 10:30–12:00".
 *
 * The field has two possible shapes:
 *   Simple:  "Tue 6:30PM - 9:30PM"
 *   Dated:   "Tue 09/19/2023 6:00PM - 9:00PM<br/>Tue 09/26/2023 6:00PM - 9:00PM<br/>..."
 *
 * Output examples:
 *   "Tue 6:30–9:30"           (single day, same time every week)
 *   "Mon / Thu 8:30–10:00"    (two days, same time)
 *   "Mon 6:30–9:30"           (evening section)
 */
function parseMeetingPattern(raw) {
  if (!raw) return '';

  // Normalise: split on <br/> (or <br>) to get individual session strings
  const sessions = raw
    .split(/<br\s*\/?>/i)
    .map(s => s.trim())
    .filter(Boolean);

  // Day name abbreviations we recognise
  const DAY_RE = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/;
  // Optional date segment: "09/19/2023 " — we want to strip it
  const DATE_SEG_RE = /\d{2}\/\d{2}\/\d{4}\s+/;
  // Time range: "6:00PM - 9:00PM" or "6:30PM - 9:30PM"
  const TIME_RANGE_RE = /(\d{1,2}:\d{2})(AM|PM)\s*-\s*(\d{1,2}:\d{2})(AM|PM)/i;

  /**
   * Convert "6:00PM" → "6:00", stripping :00 minutes when both sides do it.
   * We keep minutes so the caller can decide to strip trailing :00.
   */
  function fmtTime(h, m, period) {
    // Convert to 12-hour display — Kellogg already uses 12h, just strip AM/PM
    // and the period context (AM vs PM is obvious from the hour value).
    // We show PM hours as-is (6:30, 9:30) and AM hours as-is (8:30, 10:30).
    return `${h}:${m}`;
  }

  // Collect unique (day, startH, startM, endH, endM) tuples
  const seen = new Set();
  const entries = [];

  for (const session of sessions) {
    const dayMatch = session.match(DAY_RE);
    if (!dayMatch) continue;
    const day = dayMatch[1];

    // Strip the date segment if present, then look for the time range
    const withoutDate = session.replace(DATE_SEG_RE, '');
    const timeMatch = withoutDate.match(TIME_RANGE_RE);
    if (!timeMatch) continue;

    const [, startHM,, endHM] = timeMatch;
    const [startH, startM] = startHM.split(':');
    const [endH, endM] = endHM.split(':');
    const key = `${day}|${startH}:${startM}|${endH}:${endM}`;
    if (!seen.has(key)) {
      seen.add(key);
      entries.push({ day, startH, startM, endH, endM });
    }
  }

  if (entries.length === 0) return '';

  // Group by time range so we can combine multi-day sections
  // e.g. Mon 8:30-10:00 + Thu 8:30-10:00  → "Mon / Thu 8:30–10:00"
  const byTime = {};
  for (const e of entries) {
    const timeKey = `${e.startH}:${e.startM}|${e.endH}:${e.endM}`;
    if (!byTime[timeKey]) byTime[timeKey] = { startH: e.startH, startM: e.startM, endH: e.endH, endM: e.endM, days: [] };
    byTime[timeKey].days.push(e.day);
  }

  // Format each unique time range
  function trimMin(h, m) {
    // Drop ":00" if both start and end minutes are "00" — keep if non-zero
    return m === '00' ? h : `${h}:${m}`;
  }

  const parts = Object.values(byTime).map(({ startH, startM, endH, endM, days }) => {
    const start = trimMin(startH, startM);
    const end = trimMin(endH, endM);
    const dayStr = days.join(' / ');
    return `${dayStr} ${start}–${end}`;
  });

  return parts.join(', ');
}

/* ═══════════════════════════════════════════════════
   CSV PARSING
   ═══════════════════════════════════════════════════ */

function mapCSVRow(row) {
  const cost = parseFloat(row[CONFIG.COL_COST]);
  // Skip rows with no closing cost (un-bid or free sections)
  if (isNaN(cost) || cost <= 0) return null;

  // Term is "Fall 2023", "Winter 2024", etc. — split into quarter + year
  const termRaw = (row[CONFIG.COL_TERM] || '').trim();
  const termMatch = termRaw.match(/^(\S+)\s+(\d{4})$/);
  const quarter = termMatch ? termMatch[1] : termRaw;
  const year = termMatch ? termMatch[2] : '';

  // Phase is "Fall 2023 Bid Phase 1" — strip the leading "<Term> " prefix
  const phaseRaw = (row[CONFIG.COL_PHASE] || '').trim();
  const phase = phaseRaw.startsWith(termRaw)
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

  // Meeting Pattern → compact schedule string
  const schedule = parseMeetingPattern(row['Meeting Pattern'] || '');

  return {
    course: row[CONFIG.COL_COURSE] || 'Unknown',
    term: termRaw,   // combined "Fall 2023" for display
    year,
    quarter,
    phase,
    professor,
    campus,
    schedule,
    bids: parseInt(row[CONFIG.COL_BIDS]) || 0,
    seats: parseInt(row[CONFIG.COL_SEATS]) || 0,
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
  document.getElementById('gameover-screen') && document.getElementById('gameover-screen').classList.remove('active');
  document.getElementById('results-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');

  if (state.allData.length === 0) {
    await loadData();
  }

  // Reset state
  const deck = buildDeck();
  state.deck = deck.slice(1); // remaining cards
  state.timeline = [deck[0]];     // anchor — first card placed automatically
  state.cardIndex = 0;
  state.lives = CONFIG.LIVES;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.cardsAttempted = 0;
  state.isAnimating = false;
  state.clickMode = false;
  state.scoreSubmitted = false;
  state.activeDocRef = null;
  state.gameStartTime = new Date();    // record start time for leaderboard

  // Create a Firestore document immediately so every game session is tracked,
  // even if the player never submits their name at the end.
  createGameDocument();

  renderAll();
  scrollTimelineToCenter();
}

function goHome() {
  document.getElementById('results-screen').classList.remove('active');
  document.getElementById('game-screen').classList.remove('active');
  document.getElementById('start-screen').classList.add('active');
  updatePersonalBestBanner();
  fetchStartScreenLeaderboard();
}

function activeCard() {
  return state.deck[state.cardIndex] || null;
}

/** Returns true if slotIndex is a valid position for cost in the current timeline */
function isCorrectPlacement(slotIndex, cost) {
  const tl = state.timeline;
  const leftCost = slotIndex > 0 ? tl[slotIndex - 1].cost : -Infinity;
  const rightCost = slotIndex < tl.length ? tl[slotIndex].cost : Infinity;
  return leftCost <= cost && cost <= rightCost;
}

/** Find the correct slot index for a given cost in the current timeline */
function findCorrectSlot(cost) {
  const tl = state.timeline;
  for (let i = 0; i <= tl.length; i++) {
    const left = i > 0 ? tl[i - 1].cost : -Infinity;
    const right = i < tl.length ? tl[i].cost : Infinity;
    if (left <= cost && cost <= right) return i;
  }
  return tl.length;
}

function insertIntoTimeline(card, slotIndex) {
  state.timeline.splice(slotIndex, 0, card);
}

async function handlePlacement(slotIndex, placementOrigin = null) {
  if (state.isAnimating) return;
  const card = activeCard();
  if (!card) return;

  state.isAnimating = true;
  setActiveCardHidden(true);
  state.cardsAttempted++;

  // Exit click mode
  if (state.clickMode) {
    state.clickMode = false;
    document.getElementById('active-card').classList.remove('card--picked');
  }

  const correct = isCorrectPlacement(slotIndex, card.cost);

  if (correct) {
    // ── Correct ───────────────────────────────────────────────────────
    state.score++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;

    const newCardEl = insertAndAnimate(card, slotIndex, placementOrigin);
    renderStats();
    if (newCardEl) newCardEl.classList.add('card--correct');
    showToast(streakMessage(state.streak), 'correct');
    await delay(550);
    if (newCardEl) newCardEl.classList.remove('card--correct');
    advanceCard();

  } else {
    // ── Wrong ────────────────────────────────────────────────────────
    state.lives--;
    state.streak = 0;

    // Brief shake on the active card (visual feedback)
    const ac = document.getElementById('active-card');
    ac.classList.add('shake');
    ac.style.animation = 'none';
    setTimeout(() => {
      ac.classList.remove('shake');
      ac.style.animation = '';
    }, 600);

    // Fly the card from where it was picked up/released to the correct slot.
    const correctSlot = findCorrectSlot(card.cost);
    const newCardEl = insertAndAnimate(card, correctSlot, placementOrigin);
    renderStats();
    if (newCardEl) newCardEl.classList.add('card--wrong');
    showToast(`❌ It cost ${card.cost} pts — placing it correctly`, 'wrong');
    await delay(1500);
    if (newCardEl) newCardEl.classList.remove('card--wrong');

    if (state.lives <= 0) {
      await delay(400);
      showResults();
      return;
    }
    advanceCard();
  }

  state.isAnimating = false;
}

/* ═══════════════════════════════════════════════════
   FLIP ANIMATION  (insert + animate)
   ═══════════════════════════════════════════════════ */

/**
 * Returns a stable string key for a placed card DOM element.
 * Used to match elements before vs after a DOM rebuild.
 */
function getCardKey(el) {
  return el.dataset.animationKey;
}

const cardAnimationKeys = new WeakMap();
let nextCardAnimationKey = 1;

function getCardAnimationKey(card) {
  if (!cardAnimationKeys.has(card)) {
    cardAnimationKeys.set(card, String(nextCardAnimationKey++));
  }
  return cardAnimationKeys.get(card);
}

/**
 * Inserts `card` into state.timeline at `slotIndex`, rebuilds the
 * timeline DOM, then drives smooth CSS transitions:
 *
 *   • New card   — starts at the supplied `flyFromRect` (or the
 *                  active-card's position) and flies into its slot
 *                  with a spring ease.
 *   • Moved cards — FLIP: instantly placed at their OLD screen
 *                  position via transform, then transitioned to
 *                  their NEW positions.
 *
 * @param {Object}    card        The data object for the card being placed.
 * @param {number}    slotIndex   Where in the timeline to insert.
 * @param {DOMRect?}  flyFromRect Optional origin rect — if provided the
 *                                 new card animates from here instead of
 *                                 the active-card staging area.  Used on
 *                                 wrong placements so the card visually
 *                                 slides from the dropped slot to the
 *                                 correct slot.
 *
 * Returns the new card's DOM element so callers can add
 * .card--correct / .card--wrong highlights.
 */
function insertAndAnimate(card, slotIndex, flyFromRect) {
  // ── 1. Snapshot “before” screen positions of all placed cards ───────────
  const beforeEls = [...document.querySelectorAll('#timeline .card--placed')];
  const beforeRects = new Map();
  beforeEls.forEach(el => beforeRects.set(getCardKey(el), el.getBoundingClientRect()));

  // Determine the origin rect the new card will fly from.
  // Priority: explicit flyFromRect > active-card element > null (fallback).
  let originRect = flyFromRect ?? null;
  if (!originRect) {
    const activeEl = document.getElementById('active-card');
    originRect = activeEl?.getBoundingClientRect() ?? null;
  }

  // ── 2. Mutate state + rebuild DOM ──────────────────────────────────
  insertIntoTimeline(card, slotIndex);
  renderTimeline();   // full DOM rebuild, no CSS card-pop anymore

  // ── 3. Animate ───────────────────────────────────────────────────
  const afterEls = [...document.querySelectorAll('#timeline .card--placed')];
  let newCardEl = null;

  afterEls.forEach(el => {
    const key = getCardKey(el);
    const afterRect = el.getBoundingClientRect();

    if (!beforeRects.has(key)) {
      // ─ New card: fly in from the active-card position ─────────────
      newCardEl = el;

      let dx = 0, dy = -28;

      if (originRect) {
        // Vector from this card’s centre to the active card’s centre
        dx = (originRect.left + originRect.width / 2)
          - (afterRect.left + afterRect.width / 2);
        dy = (originRect.top + originRect.height / 2)
          - (afterRect.top + afterRect.height / 2);
      }

      // Stamp the card at its “before” transform instantly (no transition)
      // The moving card already uses timeline dimensions, so only its position
      // changes. Scaling here would stretch the text and create a morph effect.
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = 'none';
      el.style.zIndex = '10';
      el.style.willChange = 'transform';

      // Double rAF: first frame paints the “before” state, second kicks off transition
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = 'transform 0.46s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = '';

        // Clean up after animation completes
        setTimeout(() => {
          el.style.transition = '';
          el.style.zIndex = '';
          el.style.willChange = '';
        }, 550);
      }));

    } else {
      // ─ Existing card: FLIP to new position if it moved ───────────
      const beforeRect = beforeRects.get(key);
      const dx = beforeRect.left - afterRect.left;
      const dy = beforeRect.top - afterRect.top;

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.transition = 'none';
        el.style.willChange = 'transform';

        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)';
          el.style.transform = '';

          setTimeout(() => {
            el.style.transition = '';
            el.style.willChange = '';
          }, 420);
        }));
      }
    }
  });

  return newCardEl;
}

function advanceCard() {
  state.cardIndex++;
  if (state.cardIndex >= state.deck.length) {
    // Deck exhausted — game won!
    showResults(true);
    return;
  }
  renderActiveCard();
  renderProgress();
  scrollTimelineToCenter();
}

function streakMessage(streak) {
  if (streak >= 10) return `🔥 ${streak} streak!! Unreal!`;
  if (streak >= 7) return `🔥 ${streak} in a row! On fire!`;
  if (streak >= 5) return `🔥 ${streak} in a row!`;
  if (streak >= 3) return `✅ ${streak} streak!`;
  return '✅ Correct!';
}

/* ═══════════════════════════════════════════════════
   RESULTS SCREEN
   ═══════════════════════════════════════════════════ */
function showResults(won = false) {
  document.getElementById('game-screen').classList.remove('active');
  document.getElementById('results-screen').classList.add('active');

  // Persist final score data to the game document created at start
  updateGameDocument(won);

  // ── Header ──────────────────────────────────────
  document.getElementById('results-emoji').textContent = won ? '🏆' : '💀';
  document.getElementById('results-title').textContent = won ? 'Deck Complete!' : 'Game Over';
  document.getElementById('results-sub').textContent = won
    ? `You placed all ${state.score} cards correctly!`
    : `You placed ${state.score} out of ${state.cardsAttempted - 1} correctly.`;

  // ── Score stats ─────────────────────────────────
  document.getElementById('final-score').textContent = state.score;
  document.getElementById('final-streak').textContent = state.bestStreak;
  document.getElementById('final-cards').textContent = state.cardsAttempted;

  const accuracy = state.cardsAttempted > 0
    ? Math.round((state.score / state.cardsAttempted) * 100) : 0;
  document.getElementById('final-accuracy').textContent = accuracy + '%';

  // ── Personal best (localStorage) ────────────────
  const prevBest = parseInt(localStorage.getItem(LS_ALLTIME_BEST) || '0', 10);
  const newBest = Math.max(prevBest, state.bestStreak);
  localStorage.setItem(LS_ALLTIME_BEST, newBest);
  localStorage.setItem(LS_LAST_STREAK, state.bestStreak);

  document.getElementById('ps-this-streak').textContent = state.bestStreak;
  document.getElementById('ps-best-streak').textContent = newBest;

  // Add "new record" shimmer if we beat the previous best
  const bestEl = document.getElementById('ps-best-streak');
  if (state.bestStreak > 0 && state.bestStreak >= prevBest) {
    bestEl.classList.add('new-record');
  } else {
    bestEl.classList.remove('new-record');
  }

  // ── Reset submission UI ──────────────────────────
  const nameInput = document.getElementById('player-name-input');
  nameInput.value = '';
  nameInput.disabled = false;
  document.getElementById('submit-score-btn').disabled = false;
  document.getElementById('submit-status').textContent = '';
  document.getElementById('submit-status').className = 'submit-status';
  state.scoreSubmitted = false;

  // ── Reset share button ───────────────────────────
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.classList.remove('copied');
    shareBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share Result`;
  }

  // ── Leaderboard ──────────────────────────────────
  state.activeLbPeriod = 'week';
  setActiveTab('week');
  fetchLeaderboard('week');
}

/* ═══════════════════════════════════════════════════
   SHARE RESULT
   ═══════════════════════════════════════════════════ */
async function handleShareResult() {
  const accuracy = state.cardsAttempted > 0
    ? Math.round((state.score / state.cardsAttempted) * 100) : 0;

  const lines = [
    `📚 BidTrivia`,
    ``,
    `Score: ${state.score}/${state.cardsAttempted} · Streak: ${state.bestStreak} · Accuracy: ${accuracy}%`,
    ``,
    `Think you know the Kellogg bid market better?`,
    `kelloggbidpoints.com`,
  ];
  const shareText = lines.join('\n');

  const shareBtn = document.getElementById('share-btn');

  // Try native share on mobile, clipboard on desktop
  if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ text: shareText });
    } catch (e) {
      // User cancelled or share failed — fall through to clipboard
      if (e.name !== 'AbortError') {
        await copyToClipboard(shareText, shareBtn);
      }
    }
  } else {
    await copyToClipboard(shareText, shareBtn);
  }
}

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  // Visual feedback
  if (btn) {
    btn.classList.add('copied');
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share Result`;
    }, 2500);
  }

  showToast('Copied to clipboard!', 'info');
}

/* ═══════════════════════════════════════════════════
   LEADERBOARD — LOCAL STORAGE BANNER (start screen)
   ═══════════════════════════════════════════════════ */
function updatePersonalBestBanner() {
  const lastStreak = localStorage.getItem(LS_LAST_STREAK);
  const alltimeBest = localStorage.getItem(LS_ALLTIME_BEST);
  const banner = document.getElementById('personal-best-banner');
  if (!lastStreak && !alltimeBest) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = '';
  document.getElementById('pb-last-streak').textContent = lastStreak || '—';
  document.getElementById('pb-alltime-streak').textContent = alltimeBest || '—';
}

/* ═══════════════════════════════════════════════════
   LEADERBOARD — FIRESTORE DOCUMENT LIFECYCLE
   ═══════════════════════════════════════════════════ */

/**
 * Called at the start of each game. Creates a Firestore document immediately
 * with all fields pre-initialized so every session is recorded regardless of
 * whether the player finishes or submits a name.
 */
async function createGameDocument() {
  if (!db) return;
  try {
    const docId = state.gameStartTime.toISOString();
    const ref = db.collection('bidtrivia_leaderboard').doc(docId);
    await ref.set({
      accuracy: null,
      bestStreak: null,
      cardsAttempted: null,
      elapsedSeconds: null,
      endedAt: null,
      name: '',
      score: null,
      startedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'in_progress',
    });
    state.activeDocRef = ref;
  } catch (err) {
    console.warn('BidTrivia: could not create game document —', err.message);
  }
}

/**
 * Called when the game ends (win or loss). Updates the existing document with
 * final score data. Name remains blank until the player submits it.
 */
async function updateGameDocument(won) {
  if (!db || !state.activeDocRef) return;
  try {
    const elapsedSeconds = state.gameStartTime
      ? Math.round((Date.now() - state.gameStartTime.getTime()) / 1000)
      : null;
    const accuracy = state.cardsAttempted > 0
      ? Math.round((state.score / state.cardsAttempted) * 100) : 0;

    await state.activeDocRef.update({
      accuracy,
      bestStreak: state.bestStreak,
      cardsAttempted: state.cardsAttempted,
      elapsedSeconds,
      endedAt: firebase.firestore.FieldValue.serverTimestamp(),
      score: state.score,
      status: won ? 'won' : 'lost',
    });
  } catch (err) {
    console.warn('BidTrivia: could not update game document —', err.message);
  }
}

/* ═══════════════════════════════════════════════════
   LEADERBOARD — FIRESTORE SUBMIT
   ═══════════════════════════════════════════════════ */
async function handleSubmitScore() {
  if (state.scoreSubmitted) return;

  const nameInput = document.getElementById('player-name-input');
  const statusEl = document.getElementById('submit-status');
  const submitBtn = document.getElementById('submit-score-btn');
  const name = nameInput.value.trim();

  if (!name) {
    statusEl.textContent = 'Please enter your name first.';
    statusEl.className = 'submit-status error';
    nameInput.focus();
    return;
  }

  if (!db) {
    statusEl.textContent = 'Leaderboard unavailable (no Firebase connection).';
    statusEl.className = 'submit-status error';
    return;
  }

  // Disable UI during submit
  submitBtn.disabled = true;
  nameInput.disabled = true;
  statusEl.textContent = 'Saving…';
  statusEl.className = 'submit-status saving';

  try {
    // The game document was already created at game start and updated at game end.
    // Here we only need to patch the player's name onto the existing document.
    if (state.activeDocRef) {
      await state.activeDocRef.update({ name });
    } else {
      // Fallback: activeDocRef missing (e.g. Firebase was unavailable at start).
      // Create the full document now so the submission isn't lost.
      const accuracy = state.cardsAttempted > 0
        ? Math.round((state.score / state.cardsAttempted) * 100) : 0;
      const elapsedSeconds = state.gameStartTime
        ? Math.round((Date.now() - state.gameStartTime.getTime()) / 1000)
        : null;
      const docId = state.gameStartTime
        ? state.gameStartTime.toISOString()
        : new Date().toISOString();
      await db.collection('bidtrivia_leaderboard').doc(docId).set({
        accuracy,
        bestStreak: state.bestStreak,
        cardsAttempted: state.cardsAttempted,
        elapsedSeconds,
        endedAt: firebase.firestore.FieldValue.serverTimestamp(),
        name,
        score: state.score,
        startedAt: null,
        status: 'submitted',
      });
    }
    state.scoreSubmitted = true;
    statusEl.textContent = '✅ Score saved! See if you made the top 10.';
    statusEl.className = 'submit-status success';
    // Refresh the currently visible leaderboard
    fetchLeaderboard(state.activeLbPeriod);
  } catch (err) {
    console.error('BidTrivia: score submit failed', err);
    statusEl.textContent = '❌ Could not save — check your connection.';
    statusEl.className = 'submit-status error';
    submitBtn.disabled = false;
    nameInput.disabled = false;
  }
}

/* ═══════════════════════════════════════════════════
   LEADERBOARD — FIRESTORE FETCH
   ═══════════════════════════════════════════════════ */
function getPeriodStart(period) {
  const now = new Date();
  if (period === 'week') {
    // Monday of current week
    const day = now.getDay();               // 0 = Sun
    const diff = (day === 0 ? -6 : 1 - day); // days back to Monday
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }
  // First day of current month
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

async function fetchLeaderboard(period, listElId = 'lb-list') {
  const listEl = document.getElementById(listElId);
  if (!listEl) return;
  listEl.innerHTML = `
    <div class="lb-loading">
      <div class="lb-spinner"></div>
      <span>Loading scores…</span>
    </div>`;

  if (!db) {
    listEl.innerHTML = `<p class="lb-empty">Leaderboard unavailable — Firebase not connected.</p>`;
    return;
  }

  try {
    const periodStart = getPeriodStart(period);

    let query = db.collection('bidtrivia_leaderboard')
      .where('endedAt', '>=', periodStart)
      .orderBy('endedAt', 'asc'); // secondary: recency (endedAt asc = needed for compound index)

    // We need to order by score desc — Firestore requires the inequality field first,
    // so we fetch a larger set, sort client-side, and slice top N.
    const snapshot = await query.get();

    let entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // ── Deduplication scaffolding ─────────────────────────────────────────────
    // When CONFIG.DEDUPLICATE_BY_NAME is true, keep only each player's best game.
    // Currently false (show all entries independently).
    if (CONFIG.DEDUPLICATE_BY_NAME) {
      const bestByName = new Map();
      entries.forEach(entry => {
        const key = entry.name.toLowerCase().trim();
        const existing = bestByName.get(key);
        if (!existing || entry.score > existing.score) {
          bestByName.set(key, entry);
        }
      });
      entries = Array.from(bestByName.values());
    }

    // Sort by score descending, then by elapsed time ascending as tiebreaker
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.elapsedSeconds ?? Infinity;
      const bTime = b.elapsedSeconds ?? Infinity;
      return aTime - bTime;
    });

    const top = entries.slice(0, CONFIG.LB_TOP_N);
    renderLeaderboard(top, period, listElId);
  } catch (err) {
    console.error('BidTrivia: leaderboard fetch failed', err);
    listEl.innerHTML = `<p class="lb-empty">Could not load scores — try again shortly.</p>`;
  }
}

function renderLeaderboard(entries, period, listElId = 'lb-list') {
  const listEl = document.getElementById(listElId);
  if (!listEl) return;

  if (entries.length === 0) {
    const periodLabel = period === 'week' ? 'this week' : 'this month';
    listEl.innerHTML = `<p class="lb-empty">No scores ${periodLabel} yet — be the first! 🎯</p>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];

  listEl.innerHTML = entries.map((entry, i) => {
    const rank = i + 1;
    const rankDisplay = medals[i] || `<span class="lb-rank-num">${rank}</span>`;
    const accuracy = entry.accuracy != null ? `${entry.accuracy}%` : '—';
    const streak = entry.bestStreak != null ? `🔥${entry.bestStreak}` : '';
    const elapsed = entry.elapsedSeconds != null ? formatElapsed(entry.elapsedSeconds) : '';

    return `
      <div class="lb-row ${rank <= 3 ? 'lb-row--top' : ''}" style="animation-delay:${i * 60}ms">
        <span class="lb-rank">${rankDisplay}</span>
        <div class="lb-player">
          <span class="lb-name">${escapeHtml(entry.name)}</span>
          <span class="lb-meta">${[streak, accuracy, elapsed].filter(Boolean).join(' · ')}</span>
        </div>
        <span class="lb-score">${entry.score}</span>
      </div>`;
  }).join('');
}

/* ── Results-screen leaderboard tabs ── */
function switchLeaderboardTab(period) {
  if (period === state.activeLbPeriod) return;
  state.activeLbPeriod = period;
  setActiveTab(period);
  fetchLeaderboard(period, 'lb-list');
}

function setActiveTab(period) {
  document.getElementById('lb-tab-week').classList.toggle('active', period === 'week');
  document.getElementById('lb-tab-month').classList.toggle('active', period === 'month');
  document.getElementById('lb-tab-week').setAttribute('aria-selected', period === 'week');
  document.getElementById('lb-tab-month').setAttribute('aria-selected', period === 'month');
}

/* ── Start-screen leaderboard tabs ── */
let startLbPeriod = 'week';

function switchStartLeaderboardTab(period) {
  if (period === startLbPeriod) return;
  startLbPeriod = period;
  document.getElementById('start-lb-tab-week').classList.toggle('active', period === 'week');
  document.getElementById('start-lb-tab-month').classList.toggle('active', period === 'month');
  document.getElementById('start-lb-tab-week').setAttribute('aria-selected', period === 'week');
  document.getElementById('start-lb-tab-month').setAttribute('aria-selected', period === 'month');
  fetchLeaderboard(period, 'start-lb-list');
}

function fetchStartScreenLeaderboard() {
  fetchLeaderboard(startLbPeriod, 'start-lb-list');
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
  document.getElementById('score-display').textContent = state.score;
  renderLives();
}

function renderProgress() {
  const total = state.deck.length;
  const current = state.cardIndex + 1;
  document.getElementById('progress-text').textContent =
    `Card ${Math.min(current, total)} of ${total}`;
}

function renderActiveCard() {
  const card = activeCard();
  if (!card) return;
  setActiveCardHidden(false);
  document.getElementById('active-course').textContent = card.course;
  document.getElementById('active-professor').textContent = card.professor || '';
  // Campus + schedule inline
  const campusEl = document.getElementById('active-campus');
  campusEl.textContent = '';
  if (card.campus) {
    const campusSpan = document.createElement('span');
    campusSpan.textContent = card.campus;
    campusEl.appendChild(campusSpan);
    if (card.schedule) {
      const sep = document.createElement('span');
      sep.className = 'card-schedule-sep';
      sep.textContent = ' · ';
      campusEl.appendChild(sep);
      const schedSpan = document.createElement('span');
      schedSpan.className = 'card-schedule';
      schedSpan.textContent = card.schedule;
      campusEl.appendChild(schedSpan);
    }
  }
  // Combine term and phase on one line
  const termPhase = [card.term, card.phase].filter(Boolean).join(' · ');
  document.getElementById('active-term-phase').textContent = termPhase;
  document.getElementById('active-bids').textContent = card.bids.toLocaleString();
  document.getElementById('active-seats').textContent = card.seats.toLocaleString();
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
  slot.addEventListener('click', () => {
    if (state.isAnimating) return;
    const activeEl = document.getElementById('active-card');
    const origin = activeEl?.getBoundingClientRect() ?? null;
    handlePlacement(index, origin);
  });

  // Drag events
  slot.addEventListener('dragover', (e) => {
    e.preventDefault();
    slot.classList.add('drag-over');
  });
  slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
  slot.addEventListener('drop', (e) => {
    e.preventDefault();
    slot.classList.remove('drag-over');
    const origin = dragPreview?.getBoundingClientRect() ?? null;
    dragWasDropped = true;
    handlePlacement(index, origin);
  });

  return slot;
}

function createPlacedCard(card, revealCost = true) {
  const el = document.createElement('div');
  el.className = 'card card--placed';
  el.dataset.animationKey = getCardAnimationKey(card);

  const termPhase = [card.term, card.phase].filter(Boolean).join(' · ');
  const campusLine = card.campus
    ? (card.schedule
        ? `${card.campus}<span class="card-schedule-sep"> · </span><span class="card-schedule">${card.schedule}</span>`
        : card.campus)
    : '';
  el.innerHTML = `
    <div class="card-course-name">${card.course}</div>
    ${card.professor ? `<div class="card-professor">${card.professor}</div>` : ''}
    ${campusLine ? `<div class="card-campus">${campusLine}</div>` : ''}
    <div class="card-term-phase">${termPhase}</div>
    <div class="cost-reveal${revealCost ? '' : ' cost-reveal--hidden'}">
      <div class="cost-reveal-label">Cost</div>
      <div class="cost-reveal-value">${revealCost ? `${card.cost.toLocaleString()} pts` : '???'}</div>
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
    dragWasDropped = false;
    e.dataTransfer.effectAllowed = 'move';
    createDragPreview(ac, activeCard(), e.clientX, e.clientY);
    e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
    requestAnimationFrame(() => setActiveCardHidden(true));
  });

  ac.addEventListener('dragend', () => {
    state.dragging = false;
    removeDragPreview();
    if (!dragWasDropped) setActiveCardHidden(false);
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over'));
  });

  document.addEventListener('dragover', (e) => {
    if (dragPreview && e.clientX && e.clientY) moveDragPreview(e.clientX, e.clientY);
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

let dragPreview = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragWasDropped = false;
const transparentDragImage = new Image();
transparentDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

function createDragPreview(source, card, pointerX, pointerY) {
  removeDragPreview();
  const sourceRect = source.getBoundingClientRect();
  const pointerRatioX = (pointerX - sourceRect.left) / sourceRect.width;
  const pointerRatioY = (pointerY - sourceRect.top) / sourceRect.height;

  // Render the preview with the timeline card's real markup and typography.
  // This makes the width change instant instead of squeezing the wide text.
  dragPreview = createPlacedCard(card, false);
  dragPreview.classList.add('card--drag-preview');
  document.body.appendChild(dragPreview);

  const previewRect = dragPreview.getBoundingClientRect();
  dragOffsetX = pointerRatioX * previewRect.width;
  dragOffsetY = pointerRatioY * previewRect.height;
  moveDragPreview(pointerX, pointerY);
}

function moveDragPreview(pointerX, pointerY) {
  dragPreview.style.left = `${pointerX - dragOffsetX}px`;
  dragPreview.style.top = `${pointerY - dragOffsetY}px`;
}

function removeDragPreview() {
  dragPreview?.remove();
  dragPreview = null;
}

function setActiveCardHidden(hidden) {
  document.getElementById('active-card')
    ?.classList.toggle('card--source-hidden', hidden);
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

function formatElapsed(seconds) {
  if (seconds == null || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ═══════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  initFirebase();
  await loadData();
  initDragDrop();
  updatePersonalBestBanner();
  fetchStartScreenLeaderboard();
});
