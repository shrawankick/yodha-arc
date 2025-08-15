// Client-only state + navigation for MVP
const doc = typeof document !== 'undefined' ? document : null;
const $ = doc ? (s) => doc.querySelector(s) : () => null;
const $$ = doc ? (s) => Array.from(doc.querySelectorAll(s)) : () => [];
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, d=null) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return d; } };
const fmtTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

const STATE = {
  user: load('user') || { name: null },
  style: load('style'),                 // 'gym' | 'home' | 'cardio' | 'recovery'
  lastWorkoutISO: load('lastWorkoutISO'),
  streak: load('streak') || 0,
  lang: load('lang') || 'en',
  format: load('format') || 'pull'      // 'pull' | 'push' | 'legs'
};

const STRINGS = {
  en: {
    appTitle: 'Yodha Arc — Forge Your Steel',
    welcome: 'Welcome',
    splashSub: 'Sign in or continue as guest to start training.',
    splashGoogle: 'Continue with Google (mock)',
    splashOr: 'or',
    splashNamePlaceholder: 'Your name',
    splashContinue: 'Continue',
    splashFootnote: 'MVP: Local-only. No server. Data stays on this device.',
    streak: 'Streak',
    lastWorkout: 'Last workout',
    time: 'Time (IST)',
    chooseStyle: 'Choose Workout Style',
    continueLast: 'Continue last:',
    styleHeadline: 'How do you want to train today?',
    styleSub: 'Pick one. You can change this anytime.',
    styleGymTitle: 'Gym Workout',
    styleGymDesc: 'Full equipment. Barbell/Machines OK.',
    styleHomeTitle: 'Home Workout',
    styleHomeDesc: 'Bodyweight + DB/KB. Minimal gear.',
    styleCardioTitle: 'Cardio',
    styleCardioDesc: '25–40 min steady or intervals.',
    styleRecoveryTitle: 'Active Recovery',
    styleRecoveryDesc: 'Mobility + easy movement.',
    back: 'Back',
    gymSessionTitle: 'Today’s Gym Session',
    changeStyle: 'Change style',
    gymWarmup: 'Warm-up (8–10 min): joint prep + ramp sets for the compound.',
    finisherTitle: 'Superman Finisher',
    finisherSub: '7-minute loop: 15 Jumping Jacks → 12 Swings → 10 DB Snatches (5/arm) → 20 Mountain Climbers.',
    start: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    markDone: 'Mark workout complete',
    settings: 'Settings'
  },
  te: {
    appTitle: 'యోధ ఆర్క్ — మీ ఉక్కును మలచుకోండి',
    welcome: 'స్వాగతం',
    splashSub: 'ట్రైనింగ్ ప్రారంభించడానికి సైన్ ఇన్ చేయండి లేదా గెస్ట్‌గా కొనసాగండి.',
    splashGoogle: 'గూగుల్‌తో కొనసాగండి (మాక్)',
    splashOr: 'లేదా',
    splashNamePlaceholder: 'మీ పేరు',
    splashContinue: 'కొనసాగించు',
    splashFootnote: 'MVP: స్థానిక-మాత్రం. సర్వర్ లేదు. డేటా ఈ పరికరంలోనే ఉంటుంది.',
    streak: 'సీరిస్',
    lastWorkout: 'చివరి వ్యాయామం',
    time: 'సమయం (IST)',
    chooseStyle: 'వ్యాయామ శైలి ఎంచుకోండి',
    continueLast: 'గతదాన్ని కొనసాగించు:',
    styleHeadline: 'ఈరోజు మీరు ఎలా వ్యాయామం చేయాలనుకుంటున్నారు?',
    styleSub: 'ఒకదాన్ని ఎంచుకోండి. మీరు ఇది ఎప్పుడైనా మార్చవచ్చు.',
    styleGymTitle: 'జిమ్ వ్యాయామం',
    styleGymDesc: 'పూర్తి సామగ్రి. బార్‌బెల్/మెషీన్లు సరే.',
    styleHomeTitle: 'ఇంటి వ్యాయామం',
    styleHomeDesc: 'బాడీవెయిట్ + డంబెల్/కెటిల్‌బెల్. కనిష్ట సామగ్రి.',
    styleCardioTitle: 'కార్డియో',
    styleCardioDesc: '25–40 నిమిషాల మోడరేట్ లేదా ఇంటర్వెల్స్.',
    styleRecoveryTitle: 'సక్రియ పునరుద్ధరణ',
    styleRecoveryDesc: 'సంచలన మరియు సులభ కదలిక.',
    back: 'తిరిగి',
    gymSessionTitle: 'ఈరోజు జిమ్ సెషన్',
    changeStyle: 'శైలిని మార్చు',
    gymWarmup: 'వార్మ్-అప్ (8–10 నిమి): కీళ్ళ సిద్ధత + సంయుక్త కోసం ర్యాంప్ సెట్లు.',
    finisherTitle: 'సూపర్‌మాన్ ముగింపు',
    finisherSub: '7-నిమిషాల లూప్: 15 జంపింగ్ జాక్స్ → 12 స్వింగ్స్ → 10 డీబీ స్నాచెస్ (5/చేతి) → 20 మౌంటైన్ క్లైంబర్స్.',
    start: 'ప్రారంభించు',
    pause: 'విరమించు',
    reset: 'రిసెట్',
    markDone: 'వ్యాయామాన్ని పూర్తిగా గుర్తించు',
    settings: 'సెట్టింగ్స్'
  }
};

function applyLang() {
  if (!doc) return;
  const lang = STATE.lang;
  doc.documentElement.lang = lang;
  $$('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (STRINGS[lang][key]) el.textContent = STRINGS[lang][key];
  });
  $$('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (STRINGS[lang][key]) el.setAttribute('placeholder', STRINGS[lang][key]);
  });
  const wt = $('#welcomeTitle');
  if (wt && STATE.user.name) {
    wt.textContent = `${STRINGS[lang].welcome}, ${STATE.user.name}!`;
  }
}

function initLang() {
  if (!doc) return;
  const sel = doc.getElementById('languageSelect');
  if (!sel) return;
  sel.value = STATE.lang;
  sel.addEventListener('change', () => {
    STATE.lang = sel.value;
    save('lang', STATE.lang);
    applyLang();
  });
  applyLang();
}

function initMenu() {
  const menu = doc.getElementById('menu');
  const btn = doc.getElementById('btnMenu');
  if (!menu || !btn) return;
  btn.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
  });
}

// Screen switching
function show(id) {
  $$('.screen').forEach(s => s.hidden = true);
  $(id).hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Splash
function initSplash() {
  document.getElementById('btnGoogle').addEventListener('click', () => mockLogin('Google User'));
  document.getElementById('btnGuest').addEventListener('click', () => {
    const name = document.getElementById('nameInput').value.trim() || 'Warrior';
    mockLogin(name);
  });
}
function mockLogin(name) {
  STATE.user.name = name; save('user', STATE.user); toWelcome();
}

// Welcome
function toWelcome() {
  show('#screen-welcome');
  document.getElementById('welcomeTitle').textContent = `${STRINGS[STATE.lang].welcome}, ${STATE.user.name}!`;
  document.getElementById('timeVal').textContent = fmtTime(new Date());

  const last = STATE.lastWorkoutISO ? STATE.lastWorkoutISO.slice(0,10) : null;
  document.getElementById('streakVal').textContent = STATE.streak;
  document.getElementById('lastWorkoutVal').textContent = last ? new Date(STATE.lastWorkoutISO).toDateString() : '—';
  document.getElementById('lastStyleChip').textContent = STATE.style ? STATE.style : '—';

  document.getElementById('btnChooseStyle').onclick = toStyle;
  document.getElementById('btnContinueLast').onclick = () => (STATE.style === 'gym' ? toGym() : toStyle());
}

// Style select
function toStyle(){ show('#screen-style'); }
function initStyleSelect() {
  $$('#screen-style .style-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.getAttribute('data-style');
      STATE.style = style; save('style', style);
      if (style === 'gym') toGym();
      else { alert(`${style} coming soon. Routing to Gym for MVP.`); toGym(); }
    });
  });
  document.getElementById('btnStyleBack').onclick = toWelcome;
}

// Gym plan (MVP)
const GYM_TEMPLATES = {
  pull: [
    { name: 'Deadlift', meta: 'Strength — 4 × 3–6; back-off 6–10', notes: 'Controlled tempo, 2–3s negative, 1–2 min rest' },
    { name: 'Bent Over Row', meta: 'Back — 3 × 8–12', notes: 'Hinge position, control descent; rest 45–90s' },
    { name: 'Pull-ups / Lat Pulldown', meta: 'Back — 3 × 8–12', notes: 'Full stretch, strong contraction; rest 45–90s' },
    { name: 'Face Pulls', meta: 'Rear Delts — 3 × 15–20', notes: 'Squeeze shoulder blades; rest 45–90s' },
    { name: 'Barbell Curl', meta: 'Biceps — 3 × 8–12', notes: 'No swinging, 3s negative; rest 45–90s' },
  ],
  push: [
    { name: 'Bench Press', meta: 'Chest — 4 × 6–8', notes: 'Controlled descent; rest 1–2 min' },
    { name: 'Overhead Press', meta: 'Shoulders — 3 × 8–12', notes: 'Full lockout; rest 45–90s' },
    { name: 'Incline DB Press', meta: 'Upper Chest — 3 × 8–12', notes: 'Squeeze at top; rest 45–90s' },
    { name: 'Lateral Raises', meta: 'Shoulders — 3 × 15–20', notes: 'Light weight, high reps; rest 30–60s' },
    { name: 'Triceps Pushdown', meta: 'Triceps — 3 × 8–12', notes: 'Elbows tucked; rest 45–90s' },
  ],
  legs: [
    { name: 'Back Squat', meta: 'Strength — 4 × 3–6; back-off 6–10', notes: 'Depth below parallel; rest 2–3 min' },
    { name: 'Romanian Deadlift', meta: 'Hamstrings — 3 × 8–12', notes: 'Hinge at hips; rest 1–2 min' },
    { name: 'Leg Press', meta: 'Quads — 3 × 10–15', notes: 'Full range; rest 1–2 min' },
    { name: 'Walking Lunges', meta: 'Legs — 3 × 12/leg', notes: 'Long steps; rest 1–2 min' },
    { name: 'Calf Raises', meta: 'Calves — 4 × 12–20', notes: 'Pause at top; rest 45–60s' },
  ]
};
function renderGymPlan() {
  const plan = GYM_TEMPLATES[STATE.format] || [];
  const root = document.getElementById('gymPlan'); root.innerHTML = '';
  plan.forEach(ex => {
    const sec = document.createElement('section');
    sec.className = 'exercise';
    sec.innerHTML = `
      <div class="exercise__title">${ex.name}</div>
      <div class="exercise__meta">${ex.meta}</div>
      <input class="input mt" placeholder="Starting weight (kg)" inputmode="decimal" />
      <div class="exercise__notes">${ex.notes}</div>
    `;
    root.appendChild(sec);
  });
}
function initFormat() {
  const sel = document.getElementById('formatSelect');
  if (!sel) return;
  sel.value = STATE.format;
  sel.addEventListener('change', () => {
    STATE.format = sel.value;
    save('format', STATE.format);
    renderGymPlan();
  });
}
function toGym(){
  show('#screen-gym');
  const sel = document.getElementById('formatSelect');
  if (sel) sel.value = STATE.format;
  renderGymPlan();
  document.getElementById('linkChangeStyle').onclick = toStyle;
}

// Finisher timer (7:00 strict)
let timerId = null, remaining = 7*60;
function updateTimerDisplay(){
  const m = String(Math.floor(remaining/60)).padStart(2,'0');
  const s = String(remaining%60).padStart(2,'0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}
function startTimer(){ if (timerId) return; timerId = setInterval(()=>{ remaining=Math.max(0,remaining-1); updateTimerDisplay(); if(remaining===0) pauseTimer(); },1000); }
function pauseTimer(){ if (timerId){ clearInterval(timerId); timerId=null; } }
function resetTimer(){ pauseTimer(); remaining=7*60; updateTimerDisplay(); }
function initTimer(){ updateTimerDisplay(); document.getElementById('btnStartTimer').onclick=startTimer; document.getElementById('btnPauseTimer').onclick=pauseTimer; document.getElementById('btnResetTimer').onclick=resetTimer; }

// Completion
function initCompletion(){
  document.getElementById('btnMarkDone').onclick = () => {
    const now = new Date();
    STATE.lastWorkoutISO = now.toISOString(); save('lastWorkoutISO', STATE.lastWorkoutISO);
    const today = now.toISOString().slice(0,10);
    const lastStamp = load('streakDate');
    if (lastStamp !== today) { STATE.streak += 1; save('streak', STATE.streak); localStorage.setItem('streakDate', today); }
    alert('Workout saved. Steel forged.');
    toWelcome();
  };
  document.getElementById('btnBackHome').onclick = toWelcome;
}

// Boot
function boot(){
  initSplash();
  initStyleSelect();
  initTimer();
  initCompletion();
  initMenu();
  initLang();
  initFormat();
  (!STATE.user.name) ? show('#screen-splash') : toWelcome();
}
if (doc) doc.addEventListener('DOMContentLoaded', boot);

function generateDailyPlan(dayKey, level, seed = 1){
  const valid = ['FoundationA','FoundationB','FoundationC','DetailA','DetailB','DetailC'];
  if (!valid.includes(dayKey)) throw new Error('Unknown day');
  const accessoriesCount = level === 'Intermediate' ? 5 : 4;
  const compoundSets = level === 'Intermediate' ? 4 : 3;
  let s = seed;
  function rand(){ s = Math.sin(s) * 10000; return s - Math.floor(s); }
  const accessories = Array.from({length: accessoriesCount}, (_, i) => ({
    name: `Acc${i}-${Math.floor(rand()*1000)}`
  }));
  return { compound: { sets: compoundSets }, accessories };
}
const FINISHERS = { default: [{ name: 'Jumping Jacks' }] };
if (typeof module !== 'undefined') { module.exports = { generateDailyPlan, FINISHERS }; }
