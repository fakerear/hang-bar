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
      { id: 'b2', name: 'Push-ups', target: '3 sets × 8–15 reps', sets: 3, repRange: [8, 15] },
      { id: 'b4', name: 'Split Squats', target: '3 sets × 8 each leg', sets: 3, repRange: [8, 8] },
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

const FACTS = [
  "The latissimus dorsi (lats) is the widest muscle in the human body and is primarily responsible for pull-ups.",
  "Grip strength is a strong predictor of overall health and longevity.",
  "Your core is not just your abs; it includes your obliques, lower back, and pelvic floor.",
  "Hanging from a bar decompresses your spine, which can temporarily make you slightly taller.",
  "Muscle memory is real: once you build muscle, the nuclei remain, making it easier to regain later.",
  "The average person can only hang from a bar for 30-60 seconds before grip fails.",
  "Pull-ups use over 15 major muscles in your back, arms, and core simultaneously.",
  "Your back muscles recover faster than your leg muscles after a workout.",
  "Bodyweight squats engage your glutes, quads, hamstrings, and calves.",
  "A standard pull-up uses an overhand grip, while a chin-up uses an underhand grip.",
  "The human back has 33 vertebrae, but only the top 24 are movable.",
  "Dead hangs can improve shoulder mobility and reduce the risk of rotator cuff injuries.",
  "Your grip strength naturally peaks in your 30s and slowly declines after.",
  "The push-up is one of the most efficient exercises, working your chest, shoulders, and triceps.",
  "Hanging leg raises work your lower abs, which are notoriously difficult to target.",
  "It takes about 4-6 weeks of consistent training to see visible muscle changes.",
  "The plank is a static exercise that builds endurance in your entire core.",
  "Your body has over 600 skeletal muscles, and pull-ups use a significant portion of the upper body ones.",
  "Grip strength training can lower blood pressure and improve heart health.",
  "Your spine is made up of 26 bones and over 100 joints, allowing for incredible flexibility.",
  "Proper breathing during pull-ups (exhale up, inhale down) improves performance.",
  "The rhomboids and traps are secondary muscles heavily engaged during pull-ups.",
  "Squats are one of the best exercises for improving overall mobility and balance.",
  "The bar you hang from can hold hundreds of pounds, even if it looks thin.",
  "Your forearms contain 20 muscles each, which is why they fatigue so quickly during dead hangs.",
  "Progressive overload means gradually increasing reps, sets, or resistance over time.",
  "Hanging knee raises require more core control than standard crunches.",
  "The average person gains muscle faster in their upper body than their lower body.",
  "Consistency beats intensity: training 3 days a week every week is better than sporadic heavy sessions.",
  "Your abs are made in the kitchen and revealed in the gym; diet is crucial for visible abs.",
  "Drinking water before a workout can improve performance by up to 10%."
];

const TRACKS = [
  { title: 'Workout Mix 1', artist: 'Hang Bar Mix', src: 'track1.mp3' },
  { title: 'Workout Mix 2', artist: 'Hang Bar Mix', src: 'track2.mp3' },
  { title: 'Workout Mix 3', artist: 'Hang Bar Mix', src: 'track3.mp3' },
  { title: 'Workout Mix 4', artist: 'Hang Bar Mix', src: 'track4.mp3' }
];

const DAYS = ['A', 'B', 'C'];
const STORAGE_KEY = 'hangbar_tracker_v15';
const HISTORY_KEY = 'hangbar_history_v15';
const REST_SECONDS = 60;
const CIRCUMFERENCE = 2 * Math.PI * 50;

let currentDay = 'A';
let state = {};
let history = {};
let timerInterval = null;
let timerRemaining = REST_SECONDS;
let audioCtx = null;
let wakeLock = null;
let repTarget = null;
let toastTimeout = null;
let currentFactIndex = 0;
let currentTrackIndex = 0;
let isPlaying = false;

const els = {
  clock: document.getElementById('headerClock'),
  ringFill: document.getElementById('ringFill'),
  ringPct: document.getElementById('ringPct'),
  ringSub: document.getElementById('ringSub'),
  resetAll: document.getElementById('resetAll'),
  resetSession: document.getElementById('resetSession'),
  dayTabs: document.getElementById('dayTabs'),
  dayTitle: document.getElementById('dayTitle'),
  exerciseList: document.getElementById('exerciseList'),
  timerCard: document.getElementById('timerCard'),
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
  repCancel: document.getElementById('repCancel'),
  toast: document.getElementById('toast'),
  toastIcon: document.getElementById('toastIcon'),
  toastText: document.getElementById('toastText'),
  weeklyReps: document.getElementById('weeklyReps'),
  weeklySessions: document.getElementById('weeklySessions'),
  factText: document.getElementById('factText'),
  newFactBtn: document.getElementById('newFactBtn'),
  playerTitle: document.getElementById('playerTitle'),
  playerArtist: document.getElementById('playerArtist'),
  playBtn: document.getElementById('playBtn'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  progressBar: document.getElementById('progressBar'),
  progressContainer: document.getElementById('progressContainer'),
  audio: document.getElementById('audioPlayer')
};

function haptic() { if (navigator.vibrate) navigator.vibrate(10); }

const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' });
function tickClock() { els.clock.textContent = timeFmt.format(new Date()); }
tickClock();
setInterval(tickClock, 1000);

function loadFact() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  currentFactIndex = dayOfYear % FACTS.length;
  els.factText.textContent = FACTS[currentFactIndex];
}
els.newFactBtn.onclick = () => {
  haptic();
  currentFactIndex = (currentFactIndex + 1) % FACTS.length;
  els.factText.textContent = FACTS[currentFactIndex];
};
loadFact();

function loadTrack(index) {
  if (index >= TRACKS.length) index = 0;
  if (index < 0) index = TRACKS.length - 1;
  
  currentTrackIndex = index;
  const track = TRACKS[currentTrackIndex];
  
  els.audio.src = track.src;
  els.playerTitle.textContent = track.title;
  els.playerArtist.textContent = `${track.artist} · Track ${index + 1} of ${TRACKS.length}`;
  
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'Hang Bar Tracker'
    });
  }
}

function togglePlay() {
  if (isPlaying) {
    els.audio.pause();
  } else {
    els.audio.play().catch(e => console.log('Playback prevented:', e));
  }
}

els.playBtn.onclick = () => { haptic(); togglePlay(); };
els.prevBtn.onclick = () => { haptic(); loadTrack(currentTrackIndex - 1); if (isPlaying) els.audio.play(); };
els.nextBtn.onclick = () => { haptic(); loadTrack(currentTrackIndex + 1); if (isPlaying) els.audio.play(); };

els.audio.onplay = () => { isPlaying = true; els.playBtn.innerHTML = '⏸'; };
els.audio.onpause = () => { isPlaying = false; els.playBtn.innerHTML = '▶'; };
els.audio.onended = () => { loadTrack(currentTrackIndex + 1); els.audio.play(); };

els.audio.ontimeupdate = () => {
  if (els.audio.duration) {
    const pct = (els.audio.currentTime / els.audio.duration) * 100;
    els.progressBar.style.width = pct + '%';
  }
};

els.progressContainer.onclick = (e) => {
  const rect = els.progressContainer.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  if (els.audio.duration) {
    els.audio.currentTime = pos * els.audio.duration;
  }
};

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => { els.audio.play(); });
  navigator.mediaSession.setActionHandler('pause', () => { els.audio.pause(); });
  navigator.mediaSession.setActionHandler('previoustrack', () => { els.prevBtn.click(); });
  navigator.mediaSession.setActionHandler('nexttrack', () => { els.nextBtn.click(); });
}
loadTrack(0);

function loadData() {
  try {
    const s = localStorage.getItem(STORAGE_KEY); if (s) state = JSON.parse(s);
    const h = localStorage.getItem(HISTORY_KEY); if (h) history = JSON.parse(h);
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
  return (v && typeof v === 'object') ? v : { done: false, reps: null };
}
function setEntry(day, exId, index, entry) {
  state[day + ':' + exId + ':' + index] = entry;
  saveData();
}
function dayIsComplete(day) {
  return PLAN[day].exercises.every(ex => {
    for (let i = 0; i < ex.sets; i++) if (!getSet(day, ex.id, i).done) return false;
    return true;
  });
}

function renderWeeklyStats() {
  let repsThisWeek = 0;
  let sessionsThisWeek = 0;
  DAYS.forEach(d => {
    if (dayIsComplete(d)) sessionsThisWeek++;
    PLAN[d].exercises.forEach(ex => {
      for (let i = 0; i < ex.sets; i++) {
        const s = getSet(d, ex.id, i);
        if (s.done && s.reps) repsThisWeek += s.reps;
      }
    });
  });
  els.weeklyReps.textContent = repsThisWeek;
  els.weeklySessions.innerHTML = `${sessionsThisWeek}<span style="font-size: 14px; color: var(--muted);">/3</span>`;
}

function showToast(icon, text) {
  els.toastIcon.textContent = icon;
  els.toastText.textContent = text;
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => els.toast.classList.add('hidden'), 3500);
}

function checkHistory() {
  if (dayIsComplete(currentDay)) {
    let currentTotalReps = 0;
    let previousTotalReps = 0;
    let hasPrevious = false;

    PLAN[currentDay].exercises.forEach(ex => {
      const reps = [];
      for (let i = 0; i < ex.sets; i++) {
        const r = getSet(currentDay, ex.id, i).reps;
        if (r !== null) { reps.push(r); currentTotalReps += r; }
      }
      if (reps.length) {
        const histKey = currentDay + ':' + ex.id;
        if (history[histKey]) {
          hasPrevious = true;
          previousTotalReps += history[histKey].reduce((a, b) => a + b, 0);
        }
        history[histKey] = reps;
      }
    });
    
    saveData();
    haptic();
    
    let msg = `Day ${currentDay} complete! ${currentTotalReps} total reps.`;
    if (hasPrevious) {
      const diff = currentTotalReps - previousTotalReps;
      if (diff > 0) msg += ` (+${diff} vs last time! 🔥)`;
      else if (diff < 0) msg += ` (${diff} vs last time)`;
      else msg += ` (Same as last time)`;
    }
    
    setTimeout(() => showToast('🏆', msg), 400);
  }
}

function renderTabs() {
  els.dayTabs.innerHTML = '';
  DAYS.forEach(d => {
    const btn = document.createElement('button');
    const isComplete = dayIsComplete(d);
    btn.type = 'button';
    btn.className = 'day-tab' + (d === currentDay ? ' active' : '') + (isComplete ? ' completed' : '');
    btn.textContent = 'Day ' + d + (isComplete ? ' ✓' : '');
    btn.onclick = () => { haptic(); currentDay = d; hideRepCard(); renderAll(); };
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
    
    let lastHtml = '';
    const lastReps = history[currentDay + ':' + ex.id];
    if (lastReps && lastReps.length) {
      let deltaHtml = '';
      const currentEntry = getSet(currentDay, ex.id, 0);
      if (currentEntry.done && currentEntry.reps !== null) {
         const diff = currentEntry.reps - lastReps[0];
         if (diff > 0) deltaHtml = `<span class="delta-up">↑${diff}</span>`;
         else if (diff < 0) deltaHtml = `<span class="delta-down">↓${Math.abs(diff)}</span>`;
      }
      lastHtml = `
        <div class="ex-last-wrapper">
          <div class="ex-last">Last: ${lastReps.join(' · ')} ${ex.unit || ''}</div>
          ${deltaHtml}
        </div>`;
    }

    info.innerHTML = `
      <div class="ex-name">${ex.name}</div>
      <div class="ex-target">${ex.target}</div>
      ${lastHtml}
    `;
    row.appendChild(info);

    const sets = document.createElement('div');
    sets.className = 'ex-sets';

    for (let i = 0; i < ex.sets; i++) {
      const entry = getSet(currentDay, ex.id, i);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'set-dot' + (entry.done ? ' done' : '');
      
      let inner = `<span>${i + 1}</span>`;
      if (entry.done && entry.reps != null) inner += `<span class="set-reps">${entry.reps}</span>`;
      dot.innerHTML = inner;
      
      dot.onclick = () => {
        haptic();
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
      for (let i = 0; i < ex.sets; i++) if (getSet(d, ex.id, i).done) done++;
    });
  });
  
  const pct = total ? Math.round((done / total) * 100) : 0;
  els.ringPct.textContent = pct + '%';
  els.ringSub.textContent = done + ' / ' + total + ' sets';
  els.ringFill.style.strokeDashoffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  els.ringFill.style.stroke = (pct === 100) ? 'var(--success)' : 'var(--accent)';
}

function openRepCard(ex, index, entry) {
  repTarget = { ex, index };
  const [lo] = ex.repRange;
  els.repExercise.textContent = ex.name;
  els.repSetLabel.textContent = 'Set ' + (index + 1) + ' of ' + ex.sets + (ex.unit ? ' · ' + ex.unit : '');
  els.repValue.value = entry.reps != null ? entry.reps : lo;
  
  els.repCard.classList.remove('hidden', 'fade-out');
  setTimeout(() => {
    els.repCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    els.repValue.focus();
  }, 50);
}

function hideRepCard() {
  repTarget = null;
  els.repCard.classList.add('fade-out');
  setTimeout(() => els.repCard.classList.add('hidden'), 300);
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

els.repMinus.onclick = () => { haptic(); els.repValue.value = Math.max(0, parseInt(els.repValue.value || 0, 10) - 1); };
els.repPlus.onclick = () => { haptic(); els.repValue.value = Math.min(99, parseInt(els.repValue.value || 0, 10) + 1); };
els.repCancel.onclick = () => { haptic(); hideRepCard(); };
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

async function requestWakeLock() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
}
function releaseWakeLock() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

function updateTimerDisplay() {
  const m = Math.floor(timerRemaining / 60);
  const s = timerRemaining % 60;
  els.timerDisplay.textContent = m + ':' + String(s).padStart(2, '0');
  const isIdle = timerRemaining <= 0 || (timerInterval === null && timerRemaining === REST_SECONDS);
  els.timerDisplay.classList.toggle('idle', isIdle);
}

function startTimer(seconds) {
  unlockAudio();
  requestWakeLock();
  clearInterval(timerInterval);
  timerRemaining = seconds;
  els.timerDisplay.classList.remove('idle', 'ringing');
  els.timerCard.classList.remove('alert');
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timerRemaining--;
    if (timerRemaining <= 0) {
      timerRemaining = 0;
      clearInterval(timerInterval);
      timerInterval = null;
      updateTimerDisplay();
      
      els.timerDisplay.classList.add('ringing');
      els.timerCard.classList.add('alert');
      playBeep();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
      releaseWakeLock();
      
      setTimeout(() => {
        els.timerDisplay.classList.remove('ringing');
        els.timerCard.classList.remove('alert');
      }, 4000);
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function resetTimer() {
  haptic();
  clearInterval(timerInterval);
  timerInterval = null;
  timerRemaining = REST_SECONDS;
  els.timerDisplay.classList.remove('ringing');
  els.timerCard.classList.remove('alert');
  updateTimerDisplay();
  releaseWakeLock();
}

els.startTimer.onclick = () => { haptic(); startTimer(REST_SECONDS); };
els.resetTimer.onclick = resetTimer;

els.resetAll.onclick = () => {
  if (confirm('Clear ALL progress?')) {
    state = {}; history = {}; saveData(); renderAll();
  }
};

els.resetSession.onclick = () => {
  if (confirm('Reset today?')) {
    PLAN[currentDay].exercises.forEach(ex => {
      for (let i = 0; i < ex.sets; i++) {
        state[currentDay + ':' + ex.id + ':' + i] = { done: false, reps: null };
      }
    });
    saveData(); renderAll();
  }
};

function renderAll() {
  renderTabs();
  renderExercises();
  renderOverall();
  renderWeeklyStats();
  updateTimerDisplay();
}

loadData();
currentDay = DAYS.find(d => !dayIsComplete(d)) || 'A';
renderAll();
