// Yodha Arc — adaptive workout planner
const doc = typeof document !== 'undefined' ? document : null;

const storage = typeof localStorage !== 'undefined' ? localStorage : {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const save = (key, value) => {
  try { storage.setItem(key, JSON.stringify(value)); } catch (err) { console.warn('Save failed', err); }
};

const load = (key, defaultValue = null) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.warn('Load failed', err);
    return defaultValue;
  }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const DEFAULT_STATE = {
  user: load('user') || { name: 'Warrior' },
  lang: load('lang') || 'en',
  style: load('style') || 'gym',
  level: load('level') || 'Beginner',
  goal: load('goal') || 'strength',
  equipment: load('equipment') || 'freeweight',
  format: load('format') || 'push',
  intensityBias: load('intensityBias') || 1,
  logs: load('logs') || [],
  planCache: load('planCache') || {},
};

const STATE = { ...DEFAULT_STATE };

const STRINGS = {
  en: {
    appTitle: 'Yodha Arc — Forge Your Steel',
    welcome: 'Welcome',
    streak: 'Streak',
    lastWorkout: 'Last workout',
    time: 'Time (IST)',
    chooseStyle: 'Choose Plan',
    continueLast: 'Open today’s plan',
    changeStyle: 'Change plan',
    settings: 'Settings',
    levelLabel: 'Level',
    goalLabel: 'Goal',
    equipmentLabel: 'Equipment focus',
    startPlan: 'View full plan',
    markDone: 'Mark workout complete',
    back: 'Back',
    feedbackPrompt: 'How did today feel?',
    feedbackEasy: 'Too Easy',
    feedbackGood: 'Just Right',
    feedbackHard: 'Too Tough',
    notesPlaceholder: 'Notes, energy, anything worth remembering…',
    hiitTitle: 'Mandatory 7-minute HIIT Finisher',
    warmupTitle: 'Warm-up (10 min)',
    calisthenicsTag: 'Calisthenics block',
    todaysFocus: 'Today’s focus',
    rotationLabel: 'Rotation',
    durationLabel: 'Estimated duration',
    planHistory: 'Recent history',
    feedbackHeadline: 'Dial-in feedback',
    weightsHeadline: 'Track your loads',
    instructionsHeadline: 'Session breakdown',
    hiitSubtitle: 'Complete each movement for 60 seconds with 5 seconds change-over.',
    progressHeadline: 'Main lift progress',
    noHistory: 'No sessions logged yet — your graph will appear here once you complete a workout.',
    previousSummary: 'Yesterday',
  },
  te: {
    appTitle: 'యోధ ఆర్క్ — మీ ఉక్కును మలచుకోండి',
    welcome: 'స్వాగతం',
    streak: 'సీరీస్',
    lastWorkout: 'చివరి వ్యాయామం',
    time: 'సమయం (IST)',
    chooseStyle: 'ప్లాన్ ఎంచుకోండి',
    continueLast: 'ఈరోజు ప్లాన్ తెరవండి',
    changeStyle: 'ప్లాన్ మార్చు',
    settings: 'సెట్టింగ్స్',
    levelLabel: 'స్థాయి',
    goalLabel: 'లక్ష్యం',
    equipmentLabel: 'పరికర దృష్టి',
    startPlan: 'ప్లాన్ చూడండి',
    markDone: 'వ్యాయామం పూర్తి చేయబడింది',
    back: 'తిరిగి',
    feedbackPrompt: 'ఈరోజు ఎలా అనిపించింది?',
    feedbackEasy: 'చాలా సులువు',
    feedbackGood: 'సరిగ్గా ఉంది',
    feedbackHard: 'చాలా కష్టం',
    notesPlaceholder: 'గమనికలు, శక్తి, మరేమైనా…',
    hiitTitle: 'తప్పనిసరి 7 నిమిషాల HIIT ముగింపు',
    warmupTitle: 'వార్మ్-అప్ (10 నిమి)',
    calisthenicsTag: 'క్యాలిస్తెనిక్స్ బ్లాక్',
    todaysFocus: 'ఈరోజు దృష్టి',
    rotationLabel: 'రోటేషన్',
    durationLabel: 'అంచనా వ్యవధి',
    planHistory: 'ఇటీవలి చరిత్ర',
    feedbackHeadline: 'ఫీడ్‌బ్యాక్',
    weightsHeadline: 'బరువులు ట్రాక్ చేయండి',
    instructionsHeadline: 'సెషన్ వివరాలు',
    hiitSubtitle: 'ప్రతి కదలికకు 60సెక్ + 5సెక్ మార్పు.',
    progressHeadline: 'ప్రధాన లిఫ్ట్ పురోగతి',
    noHistory: 'ఇంకా సెషన్లు లాగ్ కాలేదు — పూర్తయిన వెంటనే గ్రాఫ్ కనిపిస్తుంది.',
    previousSummary: 'నిన్న',
  }
};

const fmtTime = (date) => date.toLocaleTimeString('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

const baseDate = new Date('2025-01-01T00:00:00Z');
const dayIndexFromDate = (date) => Math.floor((date - baseDate) / 86400000);

const HIIT_LIBRARY = [
  ['Battle rope slams', 'Burpee broad jumps', 'Kettlebell snatches', 'Mountain climbers', 'Skater hops', 'Plank shoulder taps', 'High knees sprint'],
  ['Rowing sprint', 'Box jump overs', 'Medicine ball slams', 'Jump lunges', 'Push-up jacks', 'Hollow body rocks', 'Speed skaters'],
  ['Jump rope sprint', 'Lateral bounds', 'Thrusters', 'Bear crawl', 'Tuck jumps', 'Russian twists', 'Sprint in place'],
];

const CALISTHENICS_MOVES = [
  { name: 'Ring rows', note: 'Gym/Home/Outdoor' },
  { name: 'Archer push-ups', note: 'Progressive strength' },
  { name: 'Pistol squat to box', note: 'Control depth' },
  { name: 'Hanging leg raises', note: 'Brace hard' },
  { name: 'Handstand hold', note: 'Kick-up or wall supported' },
  { name: 'Parallel bar dips', note: 'Slow tempo' },
];

const GOAL_FOCUS = {
  strength: ['Compound priority', 'Longer rest', 'Lower rep top sets'],
  hypertrophy: ['Mind-muscle connection', 'Moderate rest', 'Higher accessory volume'],
  fatloss: ['Paired circuits', 'Reduced rest', 'Keep heart rate high'],
  endurance: ['Tempo management', 'Breathing focus', 'RPE 7–8 sustained'],
};

const EQUIPMENT_VARIANTS = {
  gym: ['freeweight', 'machines', 'calisthenics'],
  home: ['minimal', 'dumbbell', 'calisthenics'],
  outdoor: ['running', 'swimming', 'calisthenics'],
};

const GYM_LIBRARY = {
  push: {
    volume: [
      { name: 'Barbell Bench Press', sets: 3, reps: '6–8', type: 'compound', main: true },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10–12' },
      { name: 'Seated Shoulder Press', sets: 3, reps: '8–10' },
      { name: 'Cable Fly', sets: 2, reps: '15–20' },
      { name: 'Overhead Triceps Extension', sets: 2, reps: '12–15' },
    ],
    size: [
      { name: 'Paused Bench Press', sets: 4, reps: '5', type: 'compound', main: true },
      { name: 'Machine Chest Press', sets: 4, reps: '10' },
      { name: 'Arnold Press', sets: 4, reps: '10–12' },
      { name: 'Cable Lateral Raise', sets: 4, reps: '15' },
      { name: 'Rope Pressdowns', sets: 3, reps: '12–15' },
    ],
  },
  pull: {
    volume: [
      { name: 'Conventional Deadlift', sets: 3, reps: '4–6', type: 'compound', main: true },
      { name: 'Weighted Pull-up', sets: 3, reps: '6–8' },
      { name: 'Chest-supported Row', sets: 3, reps: '10–12' },
      { name: 'Face Pull', sets: 2, reps: '15–20' },
      { name: 'Incline Curl', sets: 2, reps: '12–15' },
    ],
    size: [
      { name: 'Deficit Deadlift', sets: 4, reps: '5', type: 'compound', main: true },
      { name: 'Lat Pulldown (neutral)', sets: 4, reps: '10' },
      { name: 'Cable Row', sets: 4, reps: '12' },
      { name: 'Reverse Pec Deck', sets: 3, reps: '15' },
      { name: 'Preacher Curl', sets: 3, reps: '12–15' },
    ],
  },
  legs: {
    volume: [
      { name: 'Back Squat', sets: 3, reps: '6–8', type: 'compound', main: true },
      { name: 'Romanian Deadlift', sets: 3, reps: '8–10' },
      { name: 'Walking Lunges', sets: 3, reps: '12/leg' },
      { name: 'Leg Curl', sets: 2, reps: '15' },
      { name: 'Standing Calf Raise', sets: 3, reps: '15–20' },
    ],
    size: [
      { name: 'Front Squat', sets: 4, reps: '5', type: 'compound', main: true },
      { name: 'Hack Squat', sets: 4, reps: '10' },
      { name: 'Bulgarian Split Squat', sets: 4, reps: '10/leg' },
      { name: 'Nordic Curl', sets: 3, reps: '6–8' },
      { name: 'Seated Calf Raise', sets: 4, reps: '15' },
    ],
  },
};

const HOME_LIBRARY = {
  minimal: {
    total: [
      { name: 'Tempo Push-up', sets: 3, reps: '12–15', main: true },
      { name: 'Chair Step-up', sets: 3, reps: '12/leg' },
      { name: 'Hip Bridge March', sets: 3, reps: '15' },
      { name: 'Pike Shoulder Tap', sets: 2, reps: '12' },
      { name: 'Hollow Hold', sets: 3, reps: '40s' },
    ],
  },
  dumbbell: {
    upper: [
      { name: 'Single-arm Row', sets: 3, reps: '12/side', main: true },
      { name: 'Floor Press', sets: 3, reps: '10–12' },
      { name: 'Half-kneeling Press', sets: 3, reps: '12/side' },
      { name: 'Reverse Fly', sets: 3, reps: '15' },
      { name: 'Hammer Curl', sets: 3, reps: '12' },
    ],
    lower: [
      { name: 'Goblet Squat', sets: 3, reps: '12', main: true },
      { name: 'Romanian Deadlift', sets: 3, reps: '10' },
      { name: 'Split Squat', sets: 3, reps: '12/leg' },
      { name: 'DB Swing', sets: 3, reps: '20' },
      { name: 'Calf Raise', sets: 4, reps: '20' },
    ],
  },
  calisthenics: {
    flow: CALISTHENICS_MOVES,
  },
};

const OUTDOOR_LIBRARY = {
  running: {
    plan: [
      { name: 'Dynamic stride drills', sets: 1, reps: '10 min', main: true },
      { name: 'Interval Run', sets: 6, reps: '400m @ 5k pace' },
      { name: 'Easy Jog Recovery', sets: 6, reps: '200m walk' },
      { name: 'Hill Bounds', sets: 5, reps: '20s' },
    ],
  },
  swimming: {
    plan: [
      { name: '200m easy warm-up', sets: 1, reps: '1x', main: true },
      { name: '8 × 50m kick', sets: 8, reps: 'Moderate' },
      { name: '6 × 100m pull buoy', sets: 6, reps: 'Threshold' },
      { name: '200m cool-down', sets: 1, reps: 'Relaxed' },
    ],
  },
  calisthenics: {
    plan: CALISTHENICS_MOVES,
  },
};

const randomFrom = (items, rand) => items[Math.floor(rand() * items.length) % items.length];

const seededRandom = (seed) => {
  let s = seed;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
};

const roundDuration = (minutes) => Math.min(70, Math.round(minutes));

function adjustSetsForLevel(exercises, level, intensityBias = 1) {
  const factor = (level === 'Beginner' ? 0.8 : level === 'Intermediate' ? 1 : 1.2) * intensityBias;
  return exercises.map((exercise) => {
    if (!exercise.sets) return exercise;
    const baseSets = typeof exercise.sets === 'number' ? exercise.sets : parseInt(String(exercise.sets).split('×')[0], 10) || exercise.sets;
    const adjustedSets = Math.max(2, Math.round(baseSets * factor));
    return { ...exercise, sets: adjustedSets };
  });
}

function ensurePlanDuration(plan) {
  const base = 10; // warm-up
  const hiit = 7;
  const perSet = 3.5;
  const accessories = plan.blocks.flatMap((b) => b.exercises || []);
  const totalSets = accessories.reduce((acc, ex) => acc + (typeof ex.sets === 'number' ? ex.sets : 1), 0);
  const estimated = base + hiit + totalSets * perSet;
  plan.estimatedMinutes = roundDuration(estimated);
  if (plan.estimatedMinutes > 70) {
    plan.blocks.forEach((block) => {
      if (!block.exercises) return;
      block.exercises = block.exercises.map((ex) => {
        if (typeof ex.sets === 'number' && ex.sets > 2) {
          return { ...ex, sets: ex.sets - 1 };
        }
        return ex;
      });
    });
    const reducedSets = plan.blocks.flatMap((b) => b.exercises || [])
      .reduce((acc, ex) => acc + (typeof ex.sets === 'number' ? ex.sets : 1), 0);
    plan.estimatedMinutes = roundDuration(base + hiit + reducedSets * perSet);
  }
  return plan;
}

function buildCalisthenicsBlock(rand, intensityBias = 1, level = 'Beginner') {
  const shuffled = [...CALISTHENICS_MOVES].sort(() => rand() - 0.5);
  const baseSets = level === 'Beginner' ? 2 : level === 'Intermediate' ? 3 : 4;
  const sets = Math.max(2, Math.round(baseSets * intensityBias));
  return {
    title: STRINGS[STATE.lang].calisthenicsTag,
    type: 'calisthenics',
    exercises: shuffled.slice(0, 4).map((move) => ({ ...move, sets, reps: '8–12' })),
  };
}

function generateGymPlan({ rand, level, rotationPhase, intensityBias }) {
  const order = ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
  const format = order[rotationPhase % order.length];
  const mode = rotationPhase % 6 < 3 ? 'volume' : 'size';
  const raw = GYM_LIBRARY[format][mode];
  const adjusted = adjustSetsForLevel(raw, level, intensityBias).map((ex) => {
    if (mode === 'volume' && typeof ex.sets === 'number') {
      return { ...ex, tempo: 'Controlled 3-1-1', rest: '90s' };
    }
    if (mode === 'size' && typeof ex.sets === 'number') {
      return { ...ex, tempo: 'Explosive concentric', rest: '75s' };
    }
    return ex;
  });
  return {
    format,
    mode,
    blocks: [
      { title: 'Primary lifts', exercises: adjusted.slice(0, 3) },
      { title: 'Accessory rotation', exercises: adjusted.slice(3) },
      buildCalisthenicsBlock(rand, intensityBias, level),
    ],
  };
}

function generateHomePlan({ rand, level, rotationPhase, equipment, intensityBias }) {
  if (equipment === 'calisthenics') {
    return {
      format: 'calisthenics',
      mode: 'skill',
      blocks: [buildCalisthenicsBlock(rand, intensityBias, level)],
    };
  }
  if (equipment === 'minimal') {
    const plan = HOME_LIBRARY.minimal.total;
    return {
      format: 'total',
      mode: 'bodyweight',
      blocks: [
        { title: 'Full-body flow', exercises: adjustSetsForLevel(plan, level, intensityBias) },
        buildCalisthenicsBlock(rand, intensityBias, level),
      ],
    };
  }
  const split = rotationPhase % 2 === 0 ? 'upper' : 'lower';
  const plan = HOME_LIBRARY.dumbbell[split];
  return {
    format: split,
    mode: 'dumbbell',
    blocks: [
      { title: `${split === 'upper' ? 'Upper' : 'Lower'} power`, exercises: adjustSetsForLevel(plan, level, intensityBias) },
      buildCalisthenicsBlock(rand, intensityBias, level),
    ],
  };
}

function generateOutdoorPlan({ rand, rotationPhase, equipment, level, intensityBias }) {
  if (equipment === 'calisthenics') {
    return {
      format: 'calisthenics',
      mode: 'skill',
    blocks: [buildCalisthenicsBlock(rand, intensityBias, level)],
  };
}
  const variant = equipment === 'running' ? OUTDOOR_LIBRARY.running : OUTDOOR_LIBRARY.swimming;
  const adjusted = adjustSetsForLevel(variant.plan, level, intensityBias);
  return {
    format: equipment,
    mode: 'endurance',
    blocks: [
      { title: equipment === 'running' ? 'Track session' : 'Pool session', exercises: adjusted },
      buildCalisthenicsBlock(rand, intensityBias, level),
    ],
  };
}

function applyGoalFocus(plan, goal) {
  return {
    ...plan,
    goalFocus: GOAL_FOCUS[goal] || GOAL_FOCUS.strength,
  };
}

function generateWorkoutPlan(date = new Date(), options = {}) {
  const {
    style = STATE.style,
    level = STATE.level,
    goal = STATE.goal,
    equipment = STATE.equipment,
    intensityBias = STATE.intensityBias,
  } = options;

  const dayIndex = dayIndexFromDate(date);
  const rand = seededRandom(dayIndex + 1);
  const rotationPhase = dayIndex % 6;

  let plan;
  if (style === 'gym') {
    plan = generateGymPlan({ rand, level, rotationPhase, intensityBias });
  } else if (style === 'home') {
    plan = generateHomePlan({ rand, level, rotationPhase, equipment, intensityBias });
  } else {
    plan = generateOutdoorPlan({ rand, level, rotationPhase, equipment, intensityBias });
  }

  const hiit = randomFrom(HIIT_LIBRARY, rand);
  const calisthenics = plan.blocks.find((b) => b.type === 'calisthenics');
  if (calisthenics) {
    calisthenics.exercises = calisthenics.exercises.map((ex) => ({
      ...ex,
      reps: ex.reps || '6–10',
    }));
  }

  const withGoal = applyGoalFocus(plan, goal);
  const estimatedPlan = ensurePlanDuration({
    ...withGoal,
    style,
    level,
    goal,
    equipment,
    hiit,
    intensityBias,
    date: date.toISOString().slice(0, 10),
  });
  return estimatedPlan;
}

// UI helpers
const $ = doc ? (selector) => doc.querySelector(selector) : () => null;
const $$ = doc ? (selector) => Array.from(doc.querySelectorAll(selector)) : () => [];

function activate(id) {
  if (!doc) return;
  $$('.screen').forEach((screen) => { screen.hidden = screen.id !== id.slice(1); });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function formatPlanSummary(plan) {
  const focus = plan.goalFocus.slice(0, 2).join(' · ');
  return `${plan.style.toUpperCase()} · ${plan.format.toUpperCase()} · ${focus}`;
}

function ensureTodayPlan() {
  const key = todayKey();
  const cached = STATE.planCache[key];
  const needsRefresh = !cached
    || cached.style !== STATE.style
    || cached.level !== STATE.level
    || cached.goal !== STATE.goal
    || cached.equipment !== STATE.equipment;
  if (needsRefresh) {
    const plan = generateWorkoutPlan(new Date(), STATE);
    STATE.planCache[key] = plan;
    save('planCache', STATE.planCache);
  }
  return STATE.planCache[key];
}

function updateTime() {
  if (!doc) return;
  const node = $('#timeVal');
  if (node) node.textContent = fmtTime(new Date());
}

function computeStreak() {
  const sorted = [...STATE.logs].sort((a, b) => (a.date < b.date ? 1 : -1));
  let streak = 0;
  let prevDate = todayKey();
  sorted.forEach((entry, idx) => {
    const date = entry.date;
    if (idx === 0) {
      if (date === prevDate) streak = 1;
      prevDate = date;
      return;
    }
    const diff = Math.floor((new Date(prevDate) - new Date(date)) / 86400000);
    if (diff === 1) {
      streak += 1;
      prevDate = date;
    }
  });
  return streak;
}

function renderHistory() {
  if (!doc) return;
  const list = $('#historyList');
  if (!list) return;
  list.innerHTML = '';
  const sorted = [...STATE.logs].sort((a, b) => (a.date > b.date ? -1 : 1)).slice(0, 5);
  if (!sorted.length) {
    const empty = doc.createElement('li');
    empty.textContent = STRINGS[STATE.lang].noHistory;
    list.appendChild(empty);
    return;
  }
  sorted.forEach((log) => {
    const item = doc.createElement('li');
    item.className = 'history__item';
    const feedbackLabel = log.feedback === 'easy' ? 'Easy' : log.feedback === 'hard' ? 'Hard' : 'Balanced';
    item.innerHTML = `
      <div class="history__header">
        <span>${log.date}</span>
        <span>${log.plan.style.toUpperCase()} · ${log.plan.format.toUpperCase()}</span>
      </div>
      <div class="history__meta">${feedbackLabel} — ${log.plan.estimatedMinutes} min</div>
    `;
    list.appendChild(item);
  });
}

function renderProgressChart() {
  if (!doc) return;
  const canvas = $('#progressChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const logs = STATE.logs.filter((l) => typeof l.mainLiftWeight === 'number');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!logs.length) {
    ctx.fillStyle = '#777';
    ctx.font = '12px sans-serif';
    ctx.fillText('Log sessions with weights to see progress.', 10, canvas.height / 2);
    return;
  }
  const sorted = logs.sort((a, b) => (a.date > b.date ? 1 : -1));
  const weights = sorted.map((l) => l.mainLiftWeight);
  const dates = sorted.map((l) => l.date);
  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);
  const range = Math.max(5, maxWeight - minWeight);
  const padding = 20;
  ctx.strokeStyle = '#0b84ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  weights.forEach((weight, idx) => {
    const x = padding + (idx / (weights.length - 1 || 1)) * (canvas.width - 2 * padding);
    const y = canvas.height - padding - ((weight - minWeight) / range) * (canvas.height - 2 * padding);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    ctx.fillStyle = '#0b84ff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.font = '10px sans-serif';
    ctx.fillText(weight.toFixed(1), x - 10, y - 8);
  });
  ctx.stroke();
  ctx.fillStyle = '#444';
  ctx.font = '10px sans-serif';
  dates.forEach((date, idx) => {
    const x = padding + (idx / (weights.length - 1 || 1)) * (canvas.width - 2 * padding);
    ctx.fillText(date.slice(5), x - 15, canvas.height - 5);
  });
}

function renderPlanScreen() {
  if (!doc) return;
  const plan = ensureTodayPlan();
  $('#planFocus').textContent = formatPlanSummary(plan);
  $('#planDuration').textContent = `${plan.estimatedMinutes} min`;
  const rotationLabel = plan.mode === 'size' ? 'Size / hypertrophy focus' : plan.mode === 'volume' ? 'Volume / neural priming' : plan.mode;
  $('#planRotation').textContent = rotationLabel;
  const goalList = $('#goalFocusList');
  goalList.innerHTML = '';
  plan.goalFocus.forEach((tip) => {
    const li = doc.createElement('li');
    li.textContent = tip;
    goalList.appendChild(li);
  });
  const blockRoot = $('#planBlocks');
  blockRoot.innerHTML = '';
  plan.blocks.forEach((block, blockIndex) => {
    const section = doc.createElement('section');
    section.className = 'plan-block';
    section.innerHTML = `
      <header class="plan-block__header">
        <h3>${block.title}</h3>
      </header>
      <div class="plan-block__body"></div>
    `;
    const body = section.querySelector('.plan-block__body');
    block.exercises.forEach((exercise, index) => {
      const row = doc.createElement('div');
      row.className = 'plan-exercise';
      const mainClass = exercise.main ? 'plan-exercise--main' : '';
      row.innerHTML = `
        <div class="plan-exercise__info ${mainClass}">
          <div class="plan-exercise__name">${exercise.name}</div>
          <div class="plan-exercise__meta">${exercise.sets} × ${exercise.reps || 'as controlled'}${exercise.tempo ? ` · ${exercise.tempo}` : ''}${exercise.rest ? ` · Rest ${exercise.rest}` : ''}</div>
        </div>
        <div class="plan-exercise__track">
          <label>Weight (kg)<input type="number" step="0.5" class="weight-input" data-block="${blockIndex}" data-index="${index}" /></label>
        </div>
      `;
      body.appendChild(row);
    });
    blockRoot.appendChild(section);
  });
  const hiitList = $('#hiitList');
  hiitList.innerHTML = '';
  plan.hiit.forEach((move, idx) => {
    const li = doc.createElement('li');
    li.textContent = `${idx + 1}. ${move}`;
    hiitList.appendChild(li);
  });
}

function renderWelcome() {
  if (!doc) return;
  $('#welcomeTitle').textContent = `${STRINGS[STATE.lang].welcome}, ${STATE.user.name}!`;
  $('#lastWorkoutVal').textContent = STATE.logs.length ? STATE.logs[STATE.logs.length - 1].date : '—';
  $('#streakVal').textContent = computeStreak();
  $('#lastStyleChip').textContent = formatPlanSummary(ensureTodayPlan());
  updateTime();
  renderHistory();
  renderProgressChart();
}

function applyLang() {
  if (!doc) return;
  doc.documentElement.lang = STATE.lang;
  $$('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (STRINGS[STATE.lang][key]) el.textContent = STRINGS[STATE.lang][key];
  });
  $$('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (STRINGS[STATE.lang][key]) el.setAttribute('placeholder', STRINGS[STATE.lang][key]);
  });
  renderWelcome();
  renderPlanScreen();
}

function initLang() {
  if (!doc) return;
  const select = $('#languageSelect');
  if (!select) return;
  select.value = STATE.lang;
  select.addEventListener('change', () => {
    STATE.lang = select.value;
    save('lang', STATE.lang);
    applyLang();
  });
}

function initStyleModal() {
  if (!doc) return;
  const modal = $('#styleModal');
  if (!modal) return;
  const styleButtons = $$('#styleModal button[data-style]');
  const levelSelect = $('#levelSelect');
  const goalSelect = $('#goalSelect');
  const equipmentSelect = $('#equipmentSelect');
  updateEquipmentOptions();
  levelSelect.value = STATE.level;
  goalSelect.value = STATE.goal;
  equipmentSelect.value = STATE.equipment;
  styleButtons.forEach((btn) => {
    btn.classList.toggle('style-card--active', btn.dataset.style === STATE.style);
    btn.addEventListener('click', () => {
      STATE.style = btn.dataset.style;
      save('style', STATE.style);
      styleButtons.forEach((b) => b.classList.toggle('style-card--active', b === btn));
      updateEquipmentOptions();
    });
  });
  levelSelect.addEventListener('change', () => {
    STATE.level = levelSelect.value;
    save('level', STATE.level);
  });
  goalSelect.addEventListener('change', () => {
    STATE.goal = goalSelect.value;
    save('goal', STATE.goal);
  });
  equipmentSelect.addEventListener('change', () => {
    STATE.equipment = equipmentSelect.value;
    save('equipment', STATE.equipment);
  });
  $('#styleClose').addEventListener('click', () => { modal.hidden = true; renderWelcome(); renderPlanScreen(); });
}

function updateEquipmentOptions() {
  if (!doc) return;
  const equipmentSelect = $('#equipmentSelect');
  if (!equipmentSelect) return;
  const options = EQUIPMENT_VARIANTS[STATE.style];
  equipmentSelect.innerHTML = '';
  options.forEach((option) => {
    const opt = doc.createElement('option');
    opt.value = option;
    opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
    equipmentSelect.appendChild(opt);
  });
  if (!options.includes(STATE.equipment)) {
    STATE.equipment = options[0];
  }
  equipmentSelect.value = STATE.equipment;
}

function initMenu() {
  if (!doc) return;
  const menu = $('#menu');
  const overlay = $('#menuOverlay');
  $('#btnMenu').addEventListener('click', () => { menu.classList.add('open'); overlay.classList.add('show'); });
  overlay.addEventListener('click', () => { menu.classList.remove('open'); overlay.classList.remove('show'); });
  $('#btnMenuClose').addEventListener('click', () => { menu.classList.remove('open'); overlay.classList.remove('show'); });
}

function collectWeights() {
  const weights = [];
  $$('.weight-input').forEach((input) => {
    if (input.value) {
      weights.push({ block: Number(input.dataset.block), index: Number(input.dataset.index), weight: Number(input.value) });
    }
  });
  return weights;
}

function determineMainLiftWeight(weights, plan) {
  const mainIndices = [];
  plan.blocks.forEach((block, blockIndex) => {
    block.exercises.forEach((exercise, index) => {
      if (exercise.main) {
        mainIndices.push({ blockIndex, index });
      }
    });
  });
  const entries = weights.filter((entry) => mainIndices.some((mi) => mi.blockIndex === entry.block && mi.index === entry.index));
  if (!entries.length) return null;
  return entries.reduce((acc, entry) => acc + entry.weight, 0) / entries.length;
}

function adjustIntensity(feedback) {
  if (feedback === 'easy') STATE.intensityBias = Math.min(1.4, STATE.intensityBias + 0.05);
  if (feedback === 'hard') STATE.intensityBias = Math.max(0.7, STATE.intensityBias - 0.05);
  save('intensityBias', STATE.intensityBias);
}

function submitFeedback() {
  const plan = ensureTodayPlan();
  const weights = collectWeights();
  const feedback = $('input[name="feedback"]:checked')?.value || 'good';
  const notes = $('#feedbackNotes').value.trim();
  const mainLiftWeight = determineMainLiftWeight(weights, plan);
  const entry = {
    date: todayKey(),
    plan,
    weights,
    feedback,
    notes,
    mainLiftWeight,
  };
  STATE.logs = STATE.logs.filter((log) => log.date !== entry.date);
  STATE.logs.push(entry);
  save('logs', STATE.logs);
  adjustIntensity(feedback);
  renderWelcome();
  renderHistory();
  renderProgressChart();
  alert('Feedback stored. Tomorrow’s plan will adapt.');
  activate('#screen-welcome');
}

function showStyleModal() {
  if (!doc) return;
  const modal = $('#styleModal');
  if (!modal) return;
  modal.hidden = false;
  updateEquipmentOptions();
}

function initWelcomeActions() {
  if (!doc) return;
  $('#btnChooseStyle').addEventListener('click', () => {
    showStyleModal();
  });
  $('#btnContinueLast').addEventListener('click', () => {
    renderPlanScreen();
    activate('#screen-plan');
  });
}

function initPlanActions() {
  if (!doc) return;
  $('#linkChangeStyle').addEventListener('click', () => {
    showStyleModal();
  });
  $('#btnMarkDone').addEventListener('click', submitFeedback);
  $('#btnBackHome').addEventListener('click', () => activate('#screen-welcome'));
}

function boot() {
  if (!doc) return;
  initMenu();
  initLang();
  initStyleModal();
  initWelcomeActions();
  initPlanActions();
  ensureTodayPlan();
  applyLang();
  renderPlanScreen();
  renderWelcome();
}

if (doc) {
  doc.addEventListener('DOMContentLoaded', boot);
}

module.exports = { generateWorkoutPlan, HIIT_LIBRARY, CALISTHENICS_MOVES };

