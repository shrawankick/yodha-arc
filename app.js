// Client-only state + navigation for MVP
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, d=null) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return d; } };
const fmtTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

const STATE = {
  user: load('user') || { name: null },
  style: load('style'),                 // 'gym' | 'home' | 'cardio' | 'recovery'
  lastWorkoutISO: load('lastWorkoutISO'),
  streak: load('streak') || 0
};

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
  document.getElementById('welcomeTitle').textContent = `Welcome, ${STATE.user.name}!`;
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
  ]
};
function renderGymPlan() {
  const plan = GYM_TEMPLATES.pull;
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
function toGym(){ show('#screen-gym'); renderGymPlan(); document.getElementById('linkChangeStyle').onclick = toStyle; }

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
function boot(){ initSplash(); initStyleSelect(); initTimer(); initCompletion(); (!STATE.user.name) ? show('#screen-splash') : toWelcome(); }
document.addEventListener('DOMContentLoaded', boot);
