if (typeof document === 'undefined') {
  module.exports = {};
} else {
// App navigation and state for Yodha Arc MVP (extended)
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, d = null) => {
  try { return JSON.parse(localStorage.getItem(k)); } catch { return d; }
};

const TEXT = {
  en: {
    appTitle: 'Yodha Arc — Forge Your Steel',
    splashWelcome: 'Welcome',
    splashSub: 'Sign in or continue as guest to start training.',
    btnGoogle: 'Continue with Google (mock)',
    btnEmailLogin: 'Login',
    btnGuest: 'Continue',
    splashNote: 'MVP: Local-only. No server. Data stays on this device.',
    streakLabel: 'Streak',
    lastWorkoutLabel: 'Last workout',
    timeLabel: 'Time (IST)',
    btnChooseStyle: 'Choose Workout Style',
    btnContinueLast: 'Continue last:',
    styleHeadline: 'How do you want to train today?',
    styleSub: 'Pick one. You can change this anytime.',
    styleGym: 'Gym Workout',
    styleGymDesc: 'Full equipment. Barbell/Machines OK.',
    styleHome: 'Home Workout',
    styleHomeDesc: 'Bodyweight + DB/KB. Minimal gear.',
    styleFunctional: 'Functional',
    styleFunctionalDesc: 'Hybrid strength + cardio.',
    styleMind: 'Mindfulness',
    styleMindDesc: 'Breathing & focus.',
    btnBack: 'Back',
    levelHeadline: 'Choose Level',
    levelBeginner: 'Beginner',
    levelIntermediate: 'Intermediate',
    levelAdvanced: 'Advanced',
    weekHeadline: 'Select Week',
    typeHeadline: 'Workout Type',
    summaryHeadline: 'Ready to Train?',
    btnStartWorkout: "Start Today's Workout",
    btnNext: 'Next',
    btnSkip: 'Skip',
    btnChange: 'Change',
    restHeadline: 'Rest',
    btnSkipRest: 'Skip Rest',
    doneHeadline: 'Workout Complete',
    doneSub: 'Great job! Steel forged.',
    btnBackHome: 'Back to Home',
    settingsHeadline: 'Settings',
    settingsLangLabel: 'Language',
    settingsThemeLabel: 'Theme',
    btnClose: 'Close'
  },
  hi: {
    appTitle: 'योद्धा आर्क — अपने स्टील को गढ़ें',
    splashWelcome: 'स्वागत है',
    splashSub: 'साइन इन करें या अतिथि के रूप में जारी रखें।',
    btnGoogle: 'गूगल से जारी रखें (मॉक)',
    btnEmailLogin: 'लॉगिन',
    btnGuest: 'जारी रखें',
    splashNote: 'एमवीपी: केवल स्थानीय। कोई सर्वर नहीं। डेटा इसी डिवाइस पर रहता है।',
    streakLabel: 'स्ट्रिक',
    lastWorkoutLabel: 'पिछला वर्कआउट',
    timeLabel: 'समय (IST)',
    btnChooseStyle: 'वर्कआउट शैली चुनें',
    btnContinueLast: 'पिछला जारी रखें:',
    styleHeadline: 'आज आप कैसे ट्रेन करना चाहते हैं?',
    styleSub: 'एक चुनें। आप इसे कभी भी बदल सकते हैं।',
    styleGym: 'जिम वर्कआउट',
    styleGymDesc: 'पूर्ण उपकरण। बारबेल/मशीन ठीक।',
    styleHome: 'होम वर्कआउट',
    styleHomeDesc: 'बॉडीवेट + डंबेल/केटलबेल। न्यूनतम गियर।',
    styleFunctional: 'फंक्शनल',
    styleFunctionalDesc: 'हाइब्रिड शक्ति + कार्डियो।',
    styleMind: 'माइंडफुलनेस',
    styleMindDesc: 'श्वास और फोकस।',
    btnBack: 'वापस',
    levelHeadline: 'लेवल चुनें',
    levelBeginner: 'शुरुआती',
    levelIntermediate: 'मध्यम',
    levelAdvanced: 'उन्नत',
    weekHeadline: 'सप्ताह चुनें',
    typeHeadline: 'वर्कआउट प्रकार',
    summaryHeadline: 'ट्रेन करने के लिए तैयार?',
    btnStartWorkout: 'आज का वर्कआउट शुरू करें',
    btnNext: 'अगला',
    btnSkip: 'छोड़ें',
    btnChange: 'बदलें',
    restHeadline: 'आराम',
    btnSkipRest: 'आराम छोड़ें',
    doneHeadline: 'वर्कआउट पूरा',
    doneSub: 'बहुत बढ़िया! स्टील तैयार।',
    btnBackHome: 'होम पर वापस',
    settingsHeadline: 'सेटिंग्स',
    settingsLangLabel: 'भाषा',
    settingsThemeLabel: 'थीम',
    btnClose: 'बंद करें'
  }
};

const STATE = {
  user: load('user') || { name: null, email: null },
  lang: load('lang') || 'en',
  theme: load('theme') || 'light',
  style: load('style'),
  level: load('level'),
  week: load('week'),
  type: load('type'),
  lastWorkoutISO: load('lastWorkoutISO'),
  lastWorkoutName: load('lastWorkoutName'),
  streak: load('streak') || 0,
  plan: [],
  index: 0
};

function applyTheme() {
  document.body.classList.toggle('dark', STATE.theme === 'dark');
}
function applyLanguage() {
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const txt = TEXT[STATE.lang][key];
    if (txt !== undefined) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = txt;
      } else {
        el.textContent = txt;
      }
    }
  });
}
function show(id) {
  $$('.screen').forEach(s => s.hidden = true);
  $(id).hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function initSplash() {
  $('#btnGoogle').onclick = () => login('Google User');
  $('#btnEmailLogin').onclick = () => {
    const email = $('#emailInput').value.trim();
    const pass = $('#passInput').value.trim();
    if (email && pass) login(email.split('@')[0]);
  };
  $('#btnGuest').onclick = () => {
    const name = $('#nameInput').value.trim() || 'Warrior';
    login(name);
  };
}
function login(name) {
  STATE.user.name = name; save('user', STATE.user); toWelcome();
}

function toWelcome() {
  show('#screen-welcome');
  $('#welcomeTitle').textContent = `${TEXT[STATE.lang].splashWelcome}, ${STATE.user.name}!`;
  $('#timeVal').textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  $('#streakVal').textContent = STATE.streak;
  $('#lastWorkoutVal').textContent = STATE.lastWorkoutName || '—';
  $('#lastStyleChip').textContent = STATE.style || '—';
  $('#btnChooseStyle').onclick = toStyle;
  $('#btnContinueLast').onclick = () => {
    if (STATE.style && STATE.level && STATE.week && STATE.type) startWorkout();
    else toStyle();
  };
}

function toStyle() { show('#screen-style'); }
function initStyle() {
  $$('#screen-style .style-card').forEach(btn => {
    btn.onclick = () => {
      STATE.style = btn.dataset.style; save('style', STATE.style); toLevel();
    };
  });
  $('#btnStyleBack').onclick = toWelcome;
}
function toLevel() { show('#screen-level'); }
function initLevel() {
  $$('#screen-level .level-btn').forEach(btn => {
    btn.onclick = () => {
      STATE.level = btn.dataset.level; save('level', STATE.level); toWeek();
    };
  });
  $('#btnLevelBack').onclick = toStyle;
}
function toWeek() { show('#screen-week'); }
function initWeek() {
  $$('#screen-week .week-btn').forEach(btn => {
    btn.onclick = () => {
      STATE.week = btn.dataset.week; save('week', STATE.week); toType();
    };
  });
  $('#btnWeekBack').onclick = toLevel;
}
function toType() { show('#screen-type'); }
function initType() {
  $$('#screen-type .type-btn').forEach(btn => {
    btn.onclick = () => {
      STATE.type = btn.dataset.type; save('type', STATE.type); toSummary();
    };
  });
  $('#btnTypeBack').onclick = toWeek;
}
function toSummary() {
  $('#sumStyle').textContent = STATE.style;
  $('#sumLevel').textContent = STATE.level;
  $('#sumWeek').textContent = `Week ${STATE.week}`;
  $('#sumType').textContent = STATE.type;
  show('#screen-summary');
}
function initSummary() {
  $('#btnSummaryBack').onclick = toType;
  $('#btnStartWorkout').onclick = startWorkout;
}

const WORKOUTS = {
  gym: {
    beginner: {
      week1: {
        push: [
          { name: 'Bench Press', meta: '3 × 8', video: '', alt: ['Push-ups', 'Dumbbell Press'] },
          { name: 'Overhead Press', meta: '3 × 10', video: '', alt: ['Arnold Press'] },
          { name: 'Tricep Dips', meta: '3 × 12', video: '', alt: ['Tricep Pushdown'] }
        ],
        pull: [
          { name: 'Deadlift', meta: '3 × 5', video: '', alt: ['Rack Pull'] },
          { name: 'Bent Over Row', meta: '3 × 10', video: '', alt: ['Seated Row'] },
          { name: 'Face Pull', meta: '3 × 15', video: '', alt: ['Rear Delt Fly'] }
        ],
        legs: [
          { name: 'Back Squat', meta: '3 × 8', video: '', alt: ['Leg Press'] },
          { name: 'Lunge', meta: '3 × 10/leg', video: '', alt: ['Split Squat'] }
        ],
        full: [
          { name: 'Clean and Press', meta: '3 × 6', video: '', alt: ['Thruster'] },
          { name: 'Burpee', meta: '3 × 12', video: '', alt: ['Mountain Climber'] }
        ],
        core: [
          { name: 'Plank', meta: '3 × 30s', video: '', alt: ['Hollow Hold'] },
          { name: 'Crunch', meta: '3 × 20', video: '', alt: ['Leg Raise'] }
        ],
        cardio: [
          { name: 'Rowing Machine', meta: '5 min', video: '', alt: ['Bike'] },
          { name: 'Jump Rope', meta: '3 × 1 min', video: '', alt: ['High Knees'] }
        ]
      }
    }
  }
};
function getPlan() {
  const w = WORKOUTS[STATE.style];
  if (!w) return [];
  const l = w[STATE.level] || w.beginner;
  const week = l['week' + STATE.week] || l.week1;
  return week[STATE.type] || [];
}

function startWorkout() {
  STATE.plan = getPlan();
  STATE.index = 0;
  if (!STATE.plan.length) { alert('Plan not found.'); return; }
  showExercise();
}

function showExercise() {
  if (STATE.index >= STATE.plan.length) { showDone(); return; }
  const ex = STATE.plan[STATE.index];
  $('#workoutTitle').textContent = ex.name;
  $('#workoutMeta').textContent = ex.meta;
  $('#workoutVideo').innerHTML = ex.video ? `<video src="${ex.video}" controls></video>` : 'Video';
  show('#screen-workout');
}

function initWorkoutControls() {
  $('#btnNextExercise').onclick = () => advance();
  $('#btnSkipExercise').onclick = () => {
    STATE.index++;
    if (STATE.index >= STATE.plan.length) { showDone(); } else { showExercise(); }
  };
  $('#btnChangeExercise').onclick = () => {
    const ex = STATE.plan[STATE.index];
    const choice = prompt('Choose alternative', ex.alt.join(', '));
    if (choice && ex.alt.includes(choice)) { ex.name = choice; showExercise(); }
  };
}

let restId = null, restRemaining = 30;
function updateRest() { $('#restTimer').textContent = `00:${String(restRemaining).padStart(2, '0')}`; }
function startRest() {
  restRemaining = 30; updateRest(); show('#screen-rest');
  restId = setInterval(() => {
    restRemaining--; updateRest(); if (restRemaining <= 0) skipRest();
  }, 1000);
}
function skipRest() {
  if (restId) { clearInterval(restId); restId = null; }
  showExercise();
}
function initRest() { $('#btnRestSkip').onclick = skipRest; }
function advance() {
  STATE.index++;
  if (STATE.index >= STATE.plan.length) { showDone(); }
  else { startRest(); }
}

function showDone() { show('#screen-done'); }
function initDone() {
  $('#btnDoneHome').onclick = () => { markComplete(); toWelcome(); };
}
function markComplete() {
  const now = new Date();
  STATE.lastWorkoutISO = now.toISOString(); save('lastWorkoutISO', STATE.lastWorkoutISO);
  STATE.lastWorkoutName = STATE.type; save('lastWorkoutName', STATE.lastWorkoutName);
  const today = now.toISOString().slice(0, 10);
  const lastStamp = load('streakDate');
  if (lastStamp !== today) { STATE.streak += 1; save('streak', STATE.streak); localStorage.setItem('streakDate', today); }
}

function initSettings() {
  $('#btnSettings').onclick = () => { $('#modalSettings').hidden = false; };
  $('#btnCloseSettings').onclick = () => { $('#modalSettings').hidden = true; };
  $('#selLanguage').value = STATE.lang;
  $('#selTheme').value = STATE.theme;
  $('#selLanguage').onchange = (e) => { STATE.lang = e.target.value; save('lang', STATE.lang); applyLanguage(); toWelcome(); };
  $('#selTheme').onchange = (e) => { STATE.theme = e.target.value; save('theme', STATE.theme); applyTheme(); };
}

function boot() {
  applyTheme(); applyLanguage();
  initSplash(); initStyle(); initLevel(); initWeek(); initType(); initSummary(); initWorkoutControls(); initRest(); initDone(); initSettings();
  (!STATE.user.name) ? show('#screen-splash') : toWelcome();
}
document.addEventListener('DOMContentLoaded', boot);
}
