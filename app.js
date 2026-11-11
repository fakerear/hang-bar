'use strict';

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
const STORAGE_KEY = 'hangbar_tracker_v101';
const HISTORY_KEY = 'hangbar_history_v101';
const REST_SECONDS = 60;

let currentDay = 'A';
let state = {};
let history = {};
let timerInterval = null;
let timerRemaining = REST_SECONDS;
let audioCtx = null;
let wakeLock = null;
let repTarget = null;

function loadData() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) state = JSON.parse(s);
    const h = localStorage.getItem(HISTORY_KEY);
    if (h) history = JSON.parse(h);
  } catch (e) {}
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
}

function getSet(day, exId, index) {
  const k = day + ':' + exId + ':' + index;
  const v = state[k];
  if (v && typeof v === 'object') return v;
  return { done: false, reps: null };
}

function setEntry(day, exId, index, entry) {
  state[day + ':' + exId + ':' + index] = entry;
  saveData();
}

function dayIsComplete(day) {
  return PLAN[day].exercises.every(ex => {
    for (let i = 0; i < ex.sets; i++) {
      if (!getSet(day, ex.id, i).done) return false;
    }
    return true;
  });
}

function checkHistory() {
  if (dayIsComplete(currentDay)) {
    PLAN[currentDay].exercises.forEach(ex => {
      const reps = [];
      for (let i = 0; i < ex.sets; i++) {
        const r = getSet(currentDay, ex.id, i).reps;
        if (r !== null) reps.push(r);
      }
      if (reps.length) history[currentDay + ':' + ex.id] = reps;
    });
    saveData();
  }
}

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

function renderTabs() {
  els.dayTabs.innerHTML = '';
  DAYS.forEach(d => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-tab' + (d === currentDay ? ' active' : '');
    btn.textContent = 'Day ' + d + (dayIsComplete(d) ? ' ✓' : '');
    btn.onclick = () => { currentDay = d; hideRepCard(); renderAll(); };
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
    info.innerHTML = `<div class="ex-name">${ex.name}</div><div class="ex-target">${ex.target}</div>`;

    const lastReps = history[currentDay + ':' + ex.id];
    if (lastReps && lastReps.length) {
      const last = document.createElement('div');
      last.className = 'ex-last';
      last.textContent = 'last: ' + lastReps.join(' · ') + (ex.unit ? ' ' + ex.unit : '');
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
      
      let inner = `<span>${i + 1}</span>`;
      if (entry.done && entry.reps != null) {
        inner += `<span class="set-reps">${entry.reps}</span>`;
      }
      dot.innerHTML = inner;
      
      dot.onclick = () => {
        if (entry.done) {
          setEntry(currentDay, ex.id, i, { done: false, reps: entry.reps });
          checkHistory();
          renderAll();
        } else {
          openRepCard(ex, i, entry);
        }
      };
      sets.appendChild(dot);
    }
    row.appendChild(sets);
    els.exerciseList.appendChild(row);
  });
}

function renderOverall() {
  let total = 0, done = 0;
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

function openRepCard(ex, index, entry) {
  repTarget = { ex, index };
  const [lo] = ex.repRange;
  els.repExercise.textContent = ex.name;
  els.repSetLabel.textContent = 'Set ' + (index + 1) + ' of ' + ex.sets + (ex.unit ? ' · ' + ex.unit : '');
  els.repValue.value = entry.reps != null ? entry.reps : lo;
  els.repCard.hidden = false;
  els.repValue.focus();
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
  checkHistory();
  renderAll();
  startTimer(REST_SECONDS);
}

els.repMinus.onclick = () => { els.repValue.value = Math.max(0, parseInt(els.repValue.value || 0, 10) - 1); };
els.repPlus.onclick = () => { els.repValue.value = Math.min(99, parseInt(els.repValue.value || 0, 10) + 1); };
els.repCancel.onclick = hideRepCard;
els.repSave.onclick = () => commitReps(parseInt(els.repValue.value, 10) || 0);
els.repSkip.onclick = () => commitReps(null);

function unlockAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}

['pointerdown', 'keydown', 'touchstart'].forEach(e => document.addEventListener(e, unlockAudio, { once: true }));

function playBeep() {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    [0, 0.18, 0.36, 0.56].forEach((t, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 3 ? 1320 : 880;
      const start = now + t;
      const end = start + (i === 3 ? 0.45 : 0.12);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(end);
    });
  } catch (e) {}
}

function vibrate() {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 400]);
  }
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (e) {}
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

function updateTimerDisplay() {
  const m = Math.floor(timerRemaining / 60);
  const s = timerRemaining % 60;
  els.timerDisplay.textContent = m + ':' + String(s).padStart(2, '0');
  els.timerDisplay.classList.toggle('idle', timerRemaining <= 0 || (timerInterval === null && timerRemaining === REST_SECONDS));
}

function startTimer(seconds) {
  unlockAudio();
  requestWakeLock();
  clearInterval(timerInterval);
  timerRemaining = seconds;
  els.timerDisplay.classList.remove('idle', 'ringing');
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timerRemaining--;
    if (timerRemaining <= 0) {
      timerRemaining = 0;
      clearInterval(timerInterval);
      timerInterval = null;
      updateTimerDisplay();
      els.timerDisplay.classList.add('ringing');
      playBeep();
      vibrate();
      releaseWakeLock();
      setTimeout(() => els.timerDisplay.classList.remove('ringing'), 3000);
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRemaining = REST_SECONDS;
  els.timerDisplay.classList.remove('ringing');
  updateTimerDisplay();
  releaseWakeLock();
}

els.startTimer.onclick = () => startTimer(REST_SECONDS);
els.resetTimer.onclick = resetTimer;

els.resetAll.onclick = () => {
  if (confirm('Clear ALL progress?')) {
    state = {};
    history = {};
    saveData();
    renderAll();
  }
};

els.resetSession.onclick = () => {
  if (confirm('Reset today?')) {
    PLAN[currentDay].exercises.forEach(ex => {
      for (let i = 0; i < ex.sets; i++) {
        state[currentDay + ':' + ex.id + ':' + i] = { done: false, reps: null };
      }
    });
    saveData();
    renderAll();
  }
};

function renderAll() {
  renderTabs();
  renderExercises();
  renderOverall();
  updateTimerDisplay();
}

loadData();
currentDay = DAYS.find(d => !dayIsComplete(d)) || 'A';
renderAll();
