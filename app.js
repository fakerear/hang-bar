/* Hang Bar — Beginner Tracker
   - Per-set rep logging with last-session reference
   - Auto-selects the next unfinished day
   - Rest timer with beep + vibration + screen wake lock
   - Offline via service worker, progress in localStorage */

'use strict';

// ---------------------------------------------------------------------------
// Plan data
// ---------------------------------------------------------------------------
const PLAN = {
  A: {
    name: 'Day A — Pull Focus',
    exercises: [
      { id: 'a1', name: 'Pull-ups (or negatives)', target: '3 sets × 3–6 reps', sets: 3, repRange: [3, 6] },
      { id: 'a3', name: 'Hanging Leg Raises', target: '3 sets × 6–10 reps', sets: 3, repRange: [6, 10] },
      { id: 'a4', name: 'Dead Hang', target: '3 sets × 20–30 sec', sets: 3, repRange: [20, 30], unit: 'sec' },
      { id: 'a5', name: 'Bodyweight Squats', target: '3 sets × 12–15 reps', sets: 3, repRange: [12, 15] }
    ]
  },
  B: {
    name: 'Day B — Push & Core',
    exercises: [
      { id: 'b1', name: 'Chin-ups (or negatives)', target: '3 sets × 3–6 reps', sets: 3, repRange: [3, 6] },
      { id: 'b2', name: 'Push-ups (hands on bar or floor)', target: '3 sets × 8–15 reps', sets: 3, repRange: [8, 15] },
      { id: 'b4', name: 'Bar-Supported Split Squats', target: '3 sets × 8 each leg', sets: 3, repRange: [8, 8] },
      { id: 'b5', name: 'Plank', target: '3 sets × 30–45 sec', sets: 3, repRange: [30, 45], unit: 'sec' }
    ]
  },
  C: {
    name: 'Day C — Full Body',
    exercises: [
      { id: 'c1', name: 'Pull-ups (or negatives)', target: '3 sets × 3–6 reps', sets: 3, repRange: [3, 6] },
      { id: 'c2', name: 'Push-ups', target: '3 sets × 8–15 reps', sets: 3, repRange: [8, 15] },
      { id: 'c4', name: 'Hanging Leg Raises', target: '3 sets × 6–10 reps', sets: 3, repRange: [6, 10] },
      { id: 'c5', name: 'Dead Hang', target: '3 sets × 20–30 sec', sets: 3, repRange: [20, 30], unit: 'sec' }
    ]
  }
};

const DAYS = ['A', 'B', 'C'];
const STORAGE_KEY = 'hangbar_tracker_v5';
const HISTORY_KEY = 'hangbar_history_v1';
const REST_SECONDS = 60;

// ---------------------------------------------------------------------------
// State
//   state:  { "A:a1:0": { done: true, reps: 4 }, ... }
//   history: { "A:a1": [4, 4, 3], ... }  (last completed session's reps)
// ---------------------------------------------------------------------------
let currentDay = 'A';
let state = loadJSON(STORAGE_KEY, {});
let history = loadJSON(HISTORY_KEY, {});

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* storage may be unavailable — ignore */
  }
}

function saveState() { saveJSON(STORAGE_KEY, state); }
function saveHistory() { saveJSON(HISTORY_KEY, history); }

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const els = {
  overallStat: document.getElementById('overallStat'),
  overallFill: document.getElementById('overallFill'),
  resetAll: document.getElementById('resetAll'),
  resetSession: document.getElementById('resetSession'),
  dayTabs: document.getElementById('dayTabs'),
  dayTitle: document.getElementById('dayTitle'),
  exerciseList: document.getElementById('exerciseList'),
  timerDisplay: document.getElementById('timerDisplay'),
  startTimer: document.getElementById('startTimer'),
  resetTimer: document.getElementById('resetTimer'),
  installCard: document.getElementById('installCard'),
  installBtn: document.getElementById('installBtn'),
  repCard: document.getElementById('repCard'),
  repExercise: document.getElementById('repExercise'),
  repSetLabel: document.getElementById('repSetLabel'),
  repValue: document.getElementById('repValue'),
  repMinus: document.getElementById('repMinus'),
  repPlus: document.getElementById('repPlus'),
  repSave: document.getElementById('repSave'),
  repSkip: document.getElementById('repSkip'),
  repCancel: document.getElementById('repCancel')
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setKey(day, exId, index) {
  return day + ':' + exId + ':' + index;
}

function getSet(day, exId, index) {
  const entry = state[setKey(day, exId, index)];
  if (entry && typeof entry === 'object') return entry;
  if (entry === true) return { done: true, reps: null }; // migrate old boolean
  return { done: false, reps: null };
}

function setEntry(day, exId, index, entry) {
  state[setKey(day, exId, index)] = entry;
  saveState();
}

function dayIsComplete(day) {
  return PLAN[day].exercises.every(ex => {
    for (let i = 0; i < ex.sets; i++) {
      if (!getSet(day, ex.id, i).done) return false;
    }
    return true;
  });
}

function nextUnfinishedDay() {
  for (const d of DAYS) {
    if (!dayIsComplete(d)) return d;
  }
  return 'A';
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function renderTabs() {
  els.dayTabs.innerHTML = '';
  DAYS.forEach(d => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-tab' + (d === currentDay ? ' active' : '');
    btn.textContent = 'Day ' + d + (dayIsComplete(d) ? ' ✓' : '');
    btn.setAttribute('aria-pressed', String(d === currentDay));
    btn.addEventListener('click', () => {
      currentDay = d;
      hideRepCard();
      renderAll();
    });
    els.dayTabs.appendChild(btn);
  });
}

function renderExercises() {
  const day = PLAN[currentDay];
  els.dayTitle.textContent = day.name;
  els.exerciseList.innerHTML = '';

  day.exercises.forEach(ex => {
    const row = document.createElement('div');
    row.className = 'ex-row';

    const info = document.createElement('div');
    info.className = 'ex-info';

    const name = document.createElement('div');
    name.className = 'ex-name';
    name.textContent = ex.name;

    const target = document.createElement('div');
    target.className = 'ex-target';
    target.textContent = ex.target;

    info.appendChild(name);
    info.appendChild(target);

    const lastReps = history[currentDay + ':' + ex.id];
    if (lastReps && lastReps.length) {
      const last = document.createElement('div');
      last.className = 'ex-last';
      last.textContent = 'last session: ' + lastReps.join(' · ') + (ex.unit ? ' ' + ex.unit : ' reps');
      info.appendChild(last);
    }

    row.appendChild(info);

    const sets = document.createElement('div');
    sets.className = 'ex-sets';

    for (let i = 0; i < ex.sets; i++) {
      const entry = getSet(currentDay, ex.id, i);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'set-dot' + (entry.done ? ' done' : '');
      dot.setAttribute('aria-pressed', String(entry.done));
      dot.setAttribute('aria-label', ex.name + ', set ' + (i + 1));

      const num = document.createElement('span');
      num.textContent = String(i + 1);
      dot.appendChild(num);

      if (entry.done && entry.reps != null) {
        const reps = document.createElement('span');
        reps.className = 'set-reps';
        reps.textContent = entry.reps;
        dot.appendChild(reps);
      }

      dot.addEventListener('click', () => openRepCard(ex, i, entry));
      sets.appendChild(dot);
    }

    row.appendChild(sets);
    els.exerciseList.appendChild(row);
  });
}

function renderOverall() {
  let total = 0;
  let done = 0;

  DAYS.forEach(d => {
    PLAN[d].exercises.forEach(ex => {
      total += ex.sets;
      for (let i = 0; i < ex.sets; i++) {
        if (getSet(d, ex.id, i).done) done++;
      }
    });
  });

  els.overallStat.textContent = done + ' / ' + total + ' sets';
  els.overallFill.style.width = (total ? (done / total) * 100 : 0) + '%';
}

// ---------------------------------------------------------------------------
// Rep stepper
// ---------------------------------------------------------------------------
let repTarget = null; // { ex, index, entry, isDone }

function openRepCard(ex, index, entry) {
  // If already done, tapping again un-marks it (quick undo).
  if (entry.done) {
    setEntry(currentDay, ex.id, index, { done: false, reps: entry.reps });
    hideRepCard();
    renderExercises();
    renderOverall();
    renderTabs();
    return;
  }

  repTarget = { ex, index, entry };
  const [lo, hi] = ex.repRange;
  const fallback = entry.reps != null ? entry.reps : lo;

  els.repExercise.textContent = ex.name;
  els.repSetLabel.textContent = 'Set ' + (index + 1) + ' of ' + ex.sets +
    (ex.unit ? ' · ' + ex.unit : ' · reps');
  els.repValue.value = String(fallback);
  els.repValue.min = '0';
  els.repValue.max = '99';
  els.repCard.hidden = false;

  els.repValue.focus();
  els.repValue.select();
}

function hideRepCard() {
  repTarget = null;
  els.repCard.hidden = true;
}

function commitReps(reps) {
  if (!repTarget) return;
  const { ex, index } = repTarget;
  setEntry(currentDay, ex.id, index, { done: true, reps });
  hideRepCard();
  renderExercises();
  renderOverall();
  renderTabs();
  startTimer(REST_SECONDS);
}

function bumpReps(delta) {
  const current = parseInt(els.repValue.value, 10) || 0;
  const next = Math.min(99, Math.max(0, current + delta));
  els.repValue.value = String(next);
}

els.repMinus.addEventListener('click', () => bumpReps(-1));
els.repPlus.addEventListener('click', () => bumpReps(1));
els.repCancel.addEventListener('click', hideRepCard);

els.repSave.addEventListener('click', () => {
  const reps = parseInt(els.repValue.value, 10);
  commitReps(Number.isFinite(reps) ? Math.max(0, reps) : 0);
});

els.repSkip.addEventListener('click', () => commitReps(null));

els.repValue.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    els.repSave.click();
  } else if (event.key === 'Escape') {
    hideRepCard();
  }
});

// ---------------------------------------------------------------------------
// Audio alarm
// ---------------------------------------------------------------------------
let audioCtx = null;

function unlockAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      audioCtx = new Ctx();
    } catch (e) {
      audioCtx = null;
      return;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

function playBeep() {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const pattern = [
      { t: 0.00, dur: 0.12, freq: 880 },
      { t: 0.18, dur: 0.12, freq: 880 },
      { t: 0.36, dur: 0.12, freq: 880 },
      { t: 0.56, dur: 0.45, freq: 1320 }
    ];
    pattern.forEach(p => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = p.freq;
      const start = now + p.t;
      const end = start + p.dur;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.01);
      gain.gain.setValueAtTime(0.35, end - 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    });
  } catch (e) {
    /* best-effort */
  }
}

['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, unlockAudio, { once: true, passive: true });
});

// ---------------------------------------------------------------------------
// Vibration
// ---------------------------------------------------------------------------
function vibr
