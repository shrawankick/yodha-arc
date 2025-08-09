/*
  Yodha Arc – Cavill Physique Coach (MVP)

  This file contains all of the application logic for our progressive web
  application. The app is intentionally written in vanilla JavaScript to
  reduce external dependencies and to ensure it runs in this restricted
  environment where third‑party modules cannot be fetched from the internet.

  The high‑level responsibilities of this script are:
    • Define translation strings for English and Telugu and expose a helper
      function to fetch the appropriate translation based on the current
      language setting.
    • Maintain a small amount of application state (selected level,
      language, current day type and training history) using an in‑memory
      object that is persisted to ``localStorage``.
    • Generate a daily workout plan according to the rules described in the
      user specification: 6‑day push/pull/legs hybrid split with compound
      movements, accessories, tempo cues and a 7‑minute finisher.
    • Render a simple yet modern UI into the ``#app`` element, including
      controls for changing level/language/day, the workout table, a
      countdown timer for the finisher and a checklist for daily habits.
    • Provide a CSV export of logged workouts so users can preserve and
      analyse their progress externally.
    • Register the service worker at runtime to enable offline caching.

  The code is extensively commented so that anyone reading it can
  understand the rationale behind each section. If you plan to extend
  functionality or refactor, please keep the comments up‑to‑date.
*/

// ----------------------------- Translation Setup -----------------------------

/*
  The ``translations`` object contains all user‑visible strings in both
  supported languages. Each key corresponds to a semantic message; values
  hold the translation. When adding new UI text, add an entry here for
  each language. Telugu strings have been manually translated and may be
  simplified; feel free to refine these translations based on feedback
  from native speakers.
*/
const translations = {
  en: {
    appTitle: 'Yodha Arc – Forge Your Steel',
    selectLevel: 'Select Level',
    levelBeginner: 'Beginner',
    levelIntermediate: 'Intermediate',
    selectLanguage: 'Language',
    languageEnglish: 'English',
    languageTelugu: 'Telugu',
    selectDay: 'Training Day',
    changeStyle: 'Change Style',
    styleHome: 'Home Workout',
    styleGym: 'Gym Workout',
    styleCardio: 'Cardio',
    styleRecovery: 'Active Recovery',
    startFinisher: 'Start Finisher (7:00)',
    finisherRunning: 'Finisher running…',
    pause: 'Pause',
    reset: 'Reset',
    estimateKg: 'Estimate kg',
    finisherDefault: 'Superman Finisher',
    finisherBodyweight: 'Bodyweight Only',
    finisherLowImpact: 'Low Impact',
    exportCSV: 'Export CSV',
    warmup: 'Warm‑up (8–10 min): mobility + ramp sets for the compound lift.',
    cooldown: 'Cooldown (optional 3–5 min): breathing & light mobility.',
    checklistTitle: 'Checklist',
    checklistWater: 'Water (≥4 L)',
    checklistSleep: 'Sleep Hours',
    checklistWarmup: 'Warm‑up Done',
    checklistPump: 'Pump Achieved',
    checklistRPE: 'RPE',
    checklistMood: 'Mood / Energy',
    timerLabel: 'Time remaining:',
    downloadComplete: 'Download complete! Check your downloads folder.',
    // Day names for selection
    dayFoundationA: 'Foundation A – Push (Chest)',
    dayFoundationB: 'Foundation B – Pull (Back)',
    dayFoundationC: 'Foundation C – Legs',
    dayDetailA: 'Detail A – Shoulders/Push',
    dayDetailB: 'Detail B – Back/Biceps',
    dayDetailC: 'Detail C – Legs/Arms/Core',
  },
  te: {
    appTitle: 'యోధ ఆర్క్ – ఉక్కు పోతిరా',
    selectLevel: 'స్థాయి ఎంచుకోండి',
    levelBeginner: 'ప్రారంభం',
    levelIntermediate: 'మధ్యస్థ',
    selectLanguage: 'భాష',
    languageEnglish: 'ఆంగ్లం',
    languageTelugu: 'తెలుగు',
    selectDay: 'తరబడి రోజు',
    changeStyle: 'శైలి మార్చండి',
    styleHome: 'ఇంటి వ్యాయామం',
    styleGym: 'జిమ్ వ్యాయామం',
    styleCardio: 'కార్డియో',
    styleRecovery: 'యాక్టివ్ రికవరీ',
    startFinisher: 'ఫినిషర్ ప్రారంభించు (7:00)',
    finisherRunning: 'ఫినిషర్ నడుస్తోంది…',
    pause: 'పాజ్',
    reset: 'రిసెట్',
    estimateKg: 'కిలోలు అంచనా',
    finisherDefault: 'సూపర్‌మ్యాన్ ఫినిషర్',
    finisherBodyweight: 'బాడీవెయిట్ మాత్రమే',
    finisherLowImpact: 'లో ఇంపాక్ట్',
    exportCSV: 'CSV ఎగుమతి',
    warmup: 'వార్మ్‑అప్ (8–10 నిమిషాలు): మోబిలిటీ + ప్రధాన లిఫ్ట్ కోసం ర్యాంప్ సెట్లు.',
    cooldown: 'సడలింపు (ఐచ్ఛికం 3–5 నిమిషాలు): శ్వాస & తేలికపాటి మొబిలిటీ.',
    checklistTitle: 'చెక్‌లిస్ట్',
    checklistWater: 'నీరు (≥4 లీ)',
    checklistSleep: 'నిద్ర గంటలు',
    checklistWarmup: 'వార్మ్‑అప్ పూర్తైంది',
    checklistPump: 'పంప్ సాధ్యమైంది',
    checklistRPE: 'RPE',
    checklistMood: 'మనసు / శక్తి',
    timerLabel: 'మిగిలిన సమయం:',
    downloadComplete: 'డౌన్‌లోడ్ పూర్తయింది! మీ డౌన్‌లోడ్‌ల ఫోల్డర్‌ను చూడండి.',
    dayFoundationA: 'ఫౌండేషన్ A – పుష్ (ఛాతి)',
    dayFoundationB: 'ఫౌండేషన్ B – పుల్ (బ్యాక్)',
    dayFoundationC: 'ఫౌండేషన్ C – కాళ్లు',
    dayDetailA: 'డీటైల్ A – భుజాలు/పుష్',
    dayDetailB: 'డీటైల్ B – బ్యాక్/బైసెప్స్',
    dayDetailC: 'డీటైల్ C – కాళ్లు/ఆర్మ్స్/కోర్'
  }
};

// Finisher library
const FINISHERS = {
  default: [
    { name: 'Jumping Jacks', reps: 15 },
    { name: 'KB/DB Swings', reps: 12 },
    { name: 'DB Snatches (each arm 5)', reps: 10 },
    { name: 'Mountain Climbers', reps: 20 },
  ],
  bodyweight: [
    { name: 'High Knees', reps: 20 },
    { name: 'Push-ups', reps: 10 },
    { name: 'Air Squats', reps: 10 },
    { name: 'Mountain Climbers', reps: 20 },
  ],
  lowImpact: [
    { name: 'Step-backs', reps: 10 },
    { name: 'Hip-hinge Good-mornings', reps: 12 },
    { name: 'DB Rows (5/arm)', reps: 10 },
    { name: 'March-in-place', reps: 20 },
  ],
};

// Utility helpers for deterministic plan variation
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function computeSeedWeek() {
  const now = new Date();
  return now.getFullYear() * 100 + getISOWeek(now);
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
  }
  return Math.abs(h);
}

function seededRng(seed) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Helper to get the current translation for a given key. Falls back to the
// English string if the translation key or language is not found.
function t(key) {
  const lang = appState.language || 'en';
  return translations[lang] && translations[lang][key] ? translations[lang][key] : translations.en[key] || key;
}

// ----------------------------- Application State -----------------------------

function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return null;
  }
}

/*
  A simple object to hold state across renders. It is persisted to
  ``localStorage`` so that when the user refreshes or returns to the site
  later, their chosen settings (level, language and training history) are
  remembered. Whenever you update this object, call ``saveState()`` to
  write it back to storage.
*/
const appState = {
  level: 'Beginner',
  language: 'en',
  dayKey: 'FoundationA',
  finisherType: 'default',
  seedWeek: computeSeedWeek(),
  logs: [], // Array of logged workouts
  workoutStyle: load('workoutStyle') || null // 'home' | 'gym' | 'cardio' | 'recovery'
};

// Persist ``appState`` to ``localStorage``. JSON.stringify is used to
// serialise the object; any serialisation errors are caught silently.
function saveState() {
  try {
    localStorage.setItem('yodhaArcState', JSON.stringify(appState));
  } catch (err) {
    console.error('Error saving state', err);
  }
}

// Load state from ``localStorage`` if present. If the stored value is
// invalid or missing, the default values defined above remain in place.
function loadState() {
  try {
    const stored = localStorage.getItem('yodhaArcState');
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.assign(appState, parsed);
    }
  } catch (err) {
    console.error('Error loading state', err);
  }
}

// ----------------------------- Workout Generation ---------------------------

/*
  The ``dayDefinitions`` object enumerates the six different training days
  described by the user specification. Each entry contains the high‑level
  description and functions to choose the compound lift and accessory
  movements for that day. Accessories are chosen randomly from the provided
  lists to add variety; if you wish to enforce a weekly rotation
  deterministically you could base the choice on the current week number
  instead.
*/
const dayDefinitions = {
  FoundationA: {
    titleKey: 'dayFoundationA',
    compoundOptions: ['Barbell Bench Press', 'Dumbbell Chest Press', 'Incline Bench Press'],
    accessories: [
      { exercise: 'Cable Fly', focus: 'Chest', repsRange: '8–12', notes: '2–3s negative, squeeze chest' },
      { exercise: 'Push‑ups', focus: 'Chest', repsRange: '15–20', notes: 'Full range, tempo 2–2' },
      { exercise: 'Overhead Dumbbell Press', focus: 'Shoulders', repsRange: '8–12', notes: 'Control the eccentric' },
      { exercise: 'Lateral Raises', focus: 'Shoulders', repsRange: '12–15', notes: 'Light weight, strict form' },
      { exercise: 'Triceps Pushdown', focus: 'Triceps', repsRange: '10–15', notes: 'Elbows pinned, slow return' }
    ]
  },
  FoundationB: {
    titleKey: 'dayFoundationB',
    compoundOptions: ['Deadlift', 'Romanian Deadlift'],
    accessories: [
      { exercise: 'Bent Over Row', focus: 'Back', repsRange: '8–12', notes: 'Hinge position, control descent' },
      { exercise: 'Pull‑ups / Lat Pulldown', focus: 'Back', repsRange: '8–12', notes: 'Full stretch, strong contraction' },
      { exercise: 'Face Pulls', focus: 'Rear Delts', repsRange: '15–20', notes: 'Squeeze shoulder blades' },
      { exercise: 'Barbell Curl', focus: 'Biceps', repsRange: '8–12', notes: 'No swinging, 3s negative' },
      { exercise: 'Seated Cable Row', focus: 'Back', repsRange: '10–15', notes: 'Keep chest up, control tempo' }
    ]
  },
  FoundationC: {
    titleKey: 'dayFoundationC',
    compoundOptions: ['Back Squat', 'Front Squat'],
    accessories: [
      { exercise: 'Leg Press', focus: 'Quads', repsRange: '10–15', notes: 'Deep range, controlled' },
      { exercise: 'Romanian Deadlift', focus: 'Hamstrings', repsRange: '8–12', notes: 'Stretch and squeeze' },
      { exercise: 'Walking Lunges', focus: 'Glutes', repsRange: '10–12 each leg', notes: 'Upright torso' },
      { exercise: 'Calf Raises', focus: 'Calves', repsRange: '15–20', notes: 'Pause at top & bottom' },
      { exercise: 'Hanging Leg Raise', focus: 'Core', repsRange: '10–15', notes: 'Control, avoid swinging' }
    ]
  },
  DetailA: {
    titleKey: 'dayDetailA',
    compoundOptions: ['Seated Military Press', 'Standing Dumbbell Press'],
    accessories: [
      { exercise: 'Arnold Press', focus: 'Shoulders', repsRange: '8–12', notes: 'Rotate dumbbells, full ROM' },
      { exercise: 'Rear Delt Fly', focus: 'Rear Delts', repsRange: '12–15', notes: 'Strict, slight bend in elbow' },
      { exercise: 'Close‑Grip Bench', focus: 'Triceps', repsRange: '8–10', notes: 'Elbows tucked' },
      { exercise: 'Dumbbell Lateral Raise', focus: 'Medial Delts', repsRange: '12–15', notes: 'Light weight, pause at top' },
      { exercise: 'Upright Row', focus: 'Traps/Delts', repsRange: '10–12', notes: 'Keep elbows high' }
    ]
  },
  DetailB: {
    titleKey: 'dayDetailB',
    compoundOptions: ['Pendlay Row', 'T‑Bar Row'],
    accessories: [
      { exercise: 'Single‑Arm Dumbbell Row', focus: 'Back Thickness', repsRange: '10–12', notes: 'Row to hip, control negative' },
      { exercise: 'Lat Pulldown (Different Grip)', focus: 'Back Width', repsRange: '10–15', notes: 'Full stretch' },
      { exercise: 'Hammer Curl', focus: 'Brachialis', repsRange: '10–12', notes: 'Neutral grip, slow descent' },
      { exercise: 'Incline Dumbbell Curl', focus: 'Biceps Peak', repsRange: '10–12', notes: 'Stretch at bottom' },
      { exercise: 'Cable Rope Pullover', focus: 'Lats', repsRange: '12–15', notes: 'Focus on lats engagement' }
    ]
  },
  DetailC: {
    titleKey: 'dayDetailC',
    compoundOptions: ['Leg Press', 'Hack Squat'],
    accessories: [
      { exercise: 'Bulgarian Split Squat', focus: 'Quads/Glutes', repsRange: '8–12 each leg', notes: 'Slow negative, keep balance' },
      { exercise: 'Seated Leg Curl', focus: 'Hamstrings', repsRange: '10–15', notes: 'Squeeze at top' },
      { exercise: 'Standing Calf Raise', focus: 'Calves', repsRange: '15–20', notes: 'Pause at bottom & top' },
      { exercise: 'Skull Crushers', focus: 'Triceps', repsRange: '10–12', notes: 'Don’t lock out hard' },
      { exercise: 'Plank', focus: 'Core', repsRange: '30–60s', notes: 'Braced core, straight body' }
    ]
  }
};

/*
  ``affirmations`` is a list of motivational one‑liners aligned with the
  "superhero mindset" described in the specification. Each day the
  generator picks one at random. Feel free to expand this list for more
  variety. When adding new affirmations, ensure they are concise and
  inspiring.
*/
const affirmations = [
  'No excuses. No mercy. Just steel.',
  'Every rep forges your destiny.',
  'Strength is earned one set at a time.',
  'Push beyond yesterday – become unbreakable.',
  'Your iron will defines your arc.',
  'Sweat is your armour, pain is your forge.',
  'Rise. Grind. Conquer.',
  'Today’s effort shapes tomorrow’s hero.',
  'Hydrate. Dominate.',
  'Small plates. Big wins.',
  'Move clean. Grow mean.',
  'Respect the joints. Chase the pump.',
  'Today’s work, tomorrow’s armor.',
  'Consistency is the superpower.'
];

function buildCardioTemplate() {
  return [
    {
      exercise: 'Cardio (Bike/Row/Tread)',
      focus: 'Engine',
      sets: 1,
      repsRange: '25–40 min',
      weight: '',
      notes: 'RPE 6–7 steady OR 6x(2 min hard / 1 min easy)'
    },
    {
      exercise: 'Carry (Farmer/Suitcase)',
      focus: 'Core/Grip',
      sets: 3,
      repsRange: '20–40 m',
      weight: '',
      notes: 'Upright posture, nasal breathing'
    }
  ];
}

function buildRecoveryTemplate() {
  return [
    {
      exercise: 'Mobility Flow',
      focus: 'Hips/T-Spine',
      sets: 1,
      repsRange: '8–10 min',
      weight: '',
      notes: '90/90, Couch stretch, Cat-Cow, Thread the Needle'
    },
    {
      exercise: 'Walk or Cycle Easy',
      focus: 'Zone 2',
      sets: 1,
      repsRange: '15–20 min',
      weight: '',
      notes: 'RPE 3–4; nasal breathing'
    },
    {
      exercise: 'Deadbug / Pallof',
      focus: 'Core control',
      sets: 3,
      repsRange: '10–12',
      weight: '',
      notes: 'Slow, controlled'
    }
  ];
}

function adaptForHome(plan) {
  const compoundMap = {
    'Barbell Bench Press': 'Push-ups',
    'Incline Bench Press': 'Elevated Push-ups',
    'Deadlift': 'DB Romanian Deadlift',
    'Romanian Deadlift': 'DB Romanian Deadlift',
    'Back Squat': 'Goblet Squat',
    'Front Squat': 'Goblet Squat',
    'Leg Press': 'Reverse Lunges',
    'Hack Squat': 'Reverse Lunges',
    'Pendlay Row': 'One-arm Dumbbell Row',
    'T‑Bar Row': 'One-arm Dumbbell Row'
  };
  if (compoundMap[plan.compound.exercise]) {
    plan.compound.exercise = compoundMap[plan.compound.exercise];
  }
  const accessoryMap = {
    'Cable Fly': 'Dumbbell Fly',
    'Triceps Pushdown': 'Bench Dips',
    'Pull‑ups / Lat Pulldown': 'Pull-ups',
    'Face Pulls': 'Band Pull-aparts',
    'Seated Cable Row': 'One-arm Dumbbell Row',
    'Leg Press': 'Reverse Lunges',
    'Romanian Deadlift': 'Single-leg RDL',
    'Seated Leg Curl': 'Hamstring Slides',
    'Cable Rope Pullover': 'Band Pullover',
    'Close‑Grip Bench': 'Diamond Push-ups',
    'Upright Row': 'Dumbbell Upright Row',
    'Lat Pulldown (Different Grip)': 'Pull-ups',
    'Skull Crushers': 'Overhead Triceps Extension'
  };
  plan.accessories = plan.accessories.map((acc) => {
    const repl = accessoryMap[acc.exercise];
    return repl ? { ...acc, exercise: repl } : acc;
  });
  return plan;
}

/*
  generateDailyPlan(dayKey: string, level: string): object

  Generates a workout plan for a given day type (e.g., ``FoundationA``)
  and training level (``Beginner`` or ``Intermediate``). The function
  selects one compound movement from ``dayDefinitions[dayKey].compoundOptions``
  and randomly picks four to seven accessories depending on the level.
  Beginners perform fewer total sets; intermediate trainees have a higher
  set count and may see slightly more accessories. Tempo and rest cues are
  stored in the ``notes`` property of each exercise object.

  The returned object has the following shape:
    {
      titleKey: <translation key>,
      compound: { exercise, focus, sets, repsRange, weight, notes },
      accessories: [ { exercise, focus, sets, repsRange, weight, notes }, ... ],
      affirmation: <string>
    }
  ``weight`` is left as 'TBD' by default; users will fill their actual
  starting weight in the UI.
*/
function generateDailyPlan(dayKey, level, seed = Date.now(), workoutStyle = appState.workoutStyle) {
  if (workoutStyle === 'cardio') {
    const rng = seededRng(seed);
    const ex = buildCardioTemplate();
    const affirmation = affirmations[Math.floor(rng() * affirmations.length)];
    return {
      titleKey: 'Cardio',
      compound: ex[0],
      accessories: ex.slice(1),
      affirmation
    };
  }
  if (workoutStyle === 'recovery') {
    const rng = seededRng(seed);
    const ex = buildRecoveryTemplate();
    const affirmation = affirmations[Math.floor(rng() * affirmations.length)];
    return {
      titleKey: 'Recovery',
      compound: ex[0],
      accessories: ex.slice(1),
      affirmation
    };
  }
  const def = dayDefinitions[dayKey];
  if (!def) {
    throw new Error(`Unknown day key: ${dayKey}`);
  }
  const rng = seededRng(seed);
  const compoundLift = def.compoundOptions[Math.floor(rng() * def.compoundOptions.length)];
  const accessoryCount = level === 'Intermediate' ? 5 : 4;
  const shuffledAccessories = def.accessories
    .map((item) => ({ ...item, sort: rng() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, accessoryCount);
  const compound = {
    exercise: compoundLift,
    focus: def.titleKey.includes('Push') || def.titleKey.includes('Shoulders') ? 'Strength' : 'Strength',
    sets: level === 'Intermediate' ? 4 : 3,
    repsRange: '3–6 (strength), then 6–10 (back‑off)',
    weight: 'TBD',
    notes: 'Controlled tempo, 2–3s negative, 1–2 min rest'
  };
  const accessories = shuffledAccessories.map((acc) => {
    return {
      exercise: acc.exercise,
      focus: acc.focus,
      sets: level === 'Intermediate' ? 3 : 2,
      repsRange: acc.repsRange,
      weight: 'TBD',
      notes: `${acc.notes}; rest 45–90s`
    };
  });
  const affirmation = affirmations[Math.floor(rng() * affirmations.length)];
  let plan = {
    titleKey: def.titleKey,
    compound,
    accessories,
    affirmation
  };
  if (workoutStyle === 'home') {
    plan = adaptForHome(plan);
  }
  return plan;
}

/*
  Expose the generator function for tests. In the browser environment
  ``module`` is undefined so this branch never executes; in Node (used by
  our simple test harness) ``module`` exists and we attach the function
  for consumption by tests.
*/
if (typeof module !== 'undefined') {
  module.exports = { generateDailyPlan, FINISHERS };
}

// ----------------------------- UI Rendering ----------------------------------

/*
  render(): void

  Creates the entire application interface dynamically. The function reads
  ``appState`` to determine which day and language are selected and then
  generates the appropriate workout plan. It uses template literals to
  build HTML strings for better readability; however, consider refactoring
  into smaller functions if the markup becomes complex.

  After constructing the DOM structure, the function attaches event
  listeners to interactive elements (level/language/day selects, start
  button, export button) to update state and re-render when needed.

  The timer UI is managed separately by ``startFinisherTimer()``.
*/
function render() {
  // Update weekly seed if week has changed
  const currentWeek = computeSeedWeek();
  if (currentWeek !== appState.seedWeek) {
    appState.seedWeek = currentWeek;
    saveState();
  }
  // Generate the plan for the current state using deterministic seed
  const seed = appState.seedWeek + hashCode(appState.dayKey);
  const plan = generateDailyPlan(appState.dayKey, appState.level, seed, appState.workoutStyle);
  // Build options for the level select
  const levelOptions = [
    `<option value="Beginner" ${appState.level === 'Beginner' ? 'selected' : ''}>${t('levelBeginner')}</option>`,
    `<option value="Intermediate" ${appState.level === 'Intermediate' ? 'selected' : ''}>${t('levelIntermediate')}</option>`
  ].join('');
  // Build options for the day select using keys from dayDefinitions
  const dayOptions = Object.keys(dayDefinitions)
    .map((key) => {
      return `<option value="${key}" ${appState.dayKey === key ? 'selected' : ''}>${t(dayDefinitions[key].titleKey)}</option>`;
    })
    .join('');
  // Build language options
  const langOptions = [
    `<option value="en" ${appState.language === 'en' ? 'selected' : ''}>${t('languageEnglish')}</option>`,
    `<option value="te" ${appState.language === 'te' ? 'selected' : ''}>${t('languageTelugu')}</option>`
  ].join('');
  // Build workout rows. Start with compound then accessories
  const rows = [];
  // Helper to escape HTML entities to avoid injection in user‑facing strings
  const escape = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Compound row
  rows.push(`<tr>
    <td>${escape(plan.compound.exercise)}</td>
    <td>${escape(plan.compound.focus)}</td>
    <td>${plan.compound.sets}</td>
    <td>${escape(plan.compound.repsRange)}</td>
    <td><input type="text" class="starting-weight-input" data-type="weight" data-index="compound" placeholder="${escape(plan.compound.weight)}" /></td>
    <td>${escape(plan.compound.notes)}</td>
  </tr>`);
  // Accessory rows
  plan.accessories.forEach((acc, idx) => {
    rows.push(`<tr>
      <td>${escape(acc.exercise)}</td>
      <td>${escape(acc.focus)}</td>
      <td>${acc.sets}</td>
      <td>${escape(acc.repsRange)}</td>
      <td><input type="text" class="starting-weight-input" data-type="weight" data-index="${idx}" placeholder="${escape(acc.weight)}" /></td>
      <td>${escape(acc.notes)}</td>
    </tr>`);
  });

  // Build cards for mobile view
  const cards = [];
  const pushCard = (ex, idx) => {
    cards.push(`
      <div class="exercise-card">
        <h4>${escape(ex.exercise)}</h4>
        <div class="exercise-meta">${escape(ex.focus)} – ${ex.sets} x ${escape(ex.repsRange)}</div>
        <input type="text" class="starting-weight-input" data-type="weight" data-index="${idx}" placeholder="${escape(ex.weight)}" />
        ${ex.notes ? `<div class="exercise-notes">${escape(ex.notes)}</div>` : ''}
      </div>
    `);
  };
  pushCard(plan.compound, 'compound');
  plan.accessories.forEach((acc, idx) => pushCard(acc, idx));
  const cardsHTML = cards.join('');

  // Compose the full HTML for the workout table
  const tableHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Exercise</th>
          <th>Focus</th>
          <th>Sets</th>
          <th>Reps</th>
          <th>Starting Weight</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('\n')}
      </tbody>
    </table>
  `;
  // Build the checklist
  const checklistHTML = `
    <div id="checklistSection">
      <h3>${t('checklistTitle')}</h3>
      <label><input type="checkbox" data-check="water" /> ${t('checklistWater')}</label><br />
      <label><input type="number" min="0" max="12" step="0.5" data-check="sleep" placeholder="${t('checklistSleep')}" /> </label><br />
      <label><input type="checkbox" data-check="warmup" /> ${t('checklistWarmup')}</label><br />
      <label><input type="checkbox" data-check="pump" /> ${t('checklistPump')}</label><br />
      <label><input type="number" min="1" max="10" data-check="rpe" placeholder="${t('checklistRPE')}" /> </label><br />
      <label><input type="number" min="1" max="5" data-check="mood" placeholder="${t('checklistMood')}" /> </label>
    </div>
  `;
  const finisherOptions = [
    `<option value="default" ${appState.finisherType === 'default' ? 'selected' : ''}>${t('finisherDefault')}</option>`,
    `<option value="bodyweight" ${appState.finisherType === 'bodyweight' ? 'selected' : ''}>${t('finisherBodyweight')}</option>`,
    `<option value="lowImpact" ${appState.finisherType === 'lowImpact' ? 'selected' : ''}>${t('finisherLowImpact')}</option>`
  ].join('');
  const finisherListHTML = FINISHERS[appState.finisherType]
    .map((m) => `<li>${m.name} – ${m.reps}</li>`)
    .join('');
  // Render everything into the app container
  const app = document.getElementById('app');
  app.innerHTML = `
    <header>
      <div class="flex justify-between items-center">
        <span>${t('appTitle')}</span>
        <span class="text-sm">
          <span id="selectedStyleTag"></span>
          <button id="changeStyleBtn" class="link-btn" aria-label="${t('changeStyle')}" title="${t('changeStyle')}">${t('changeStyle')}</button>
        </span>
      </div>
    </header>
    <main class="container">
      <div class="flex justify-between items-center mb-2">
        <div>
          <label>${t('selectLevel')}</label>
          <select id="levelSelect">${levelOptions}</select>
        </div>
        <div>
          <label>${t('selectDay')}</label>
          <select id="daySelect">${dayOptions}</select>
        </div>
        <div>
          <label>${t('selectLanguage')}</label>
          <select id="langSelect">${langOptions}</select>
        </div>
      </div>
      <p class="italic mb-2">${escape(plan.affirmation)}</p>
      <p>${t('warmup')}</p>
      <div id="planTable">${tableHTML}</div>
      <div id="planCards" aria-live="polite">${cardsHTML}</div>
      <p>${t('cooldown')}</p>
      <div id="finisherSection">
        <select id="finisherSelect">${finisherOptions}</select>
        <ul id="finisherList">${finisherListHTML}</ul>
        <div id="currentMove" style="font-weight: bold; margin-top: 0.5rem;"></div>
        <div id="timerContainer" style="margin-top: 1rem; font-size: 1.2rem;">07:00</div>
        <button id="startFinisherBtn" class="btn">${t('startFinisher')}</button>
        <button id="pauseFinisherBtn" class="btn">${t('pause')}</button>
        <button id="resetFinisherBtn" class="btn">${t('reset')}</button>
      </div>
      ${checklistHTML}
      <button id="exportBtn" class="btn">${t('exportCSV')}</button>
    </main>
    <footer>&copy; ${new Date().getFullYear()} Yodha Arc</footer>
  `;
  renderHeaderStyleTag();
  // Attach event listeners
  document.getElementById('levelSelect').addEventListener('change', (e) => {
    appState.level = e.target.value;
    saveState();
    render();
  });
  document.getElementById('daySelect').addEventListener('change', (e) => {
    appState.dayKey = e.target.value;
    saveState();
    render();
  });
  document.getElementById('langSelect').addEventListener('change', (e) => {
    appState.language = e.target.value;
    saveState();
    render();
  });
  document.getElementById('finisherSelect').addEventListener('change', (e) => {
    appState.finisherType = e.target.value;
    saveState();
    render();
  });
  document.getElementById('startFinisherBtn').addEventListener('click', () => {
    startFinisherTimer(7 * 60, FINISHERS[appState.finisherType]);
  });
  document.getElementById('pauseFinisherBtn').addEventListener('click', () => {
    pauseFinisherTimer();
  });
  document.getElementById('resetFinisherBtn').addEventListener('click', () => {
    resetFinisherTimer();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    exportCSV();
  });
  document.getElementById('changeStyleBtn').addEventListener('click', showStyleScreen);
}

// ----------------------------- Finisher Timer --------------------------------

let timerInterval = null;
const finisherState = { time: 0, moves: [], moveIndex: 0 };

function startFinisherTimer(duration, moves) {
  const timerContainer = document.getElementById('timerContainer');
  const moveEl = document.getElementById('currentMove');
  finisherState.time = duration;
  finisherState.moves = moves || [];
  finisherState.moveIndex = 0;
  if (finisherState.moves[0]) {
    moveEl.textContent = `${finisherState.moves[0].name} x ${finisherState.moves[0].reps}`;
  }
  timerContainer.textContent = `${t('timerLabel')} ${formatTime(finisherState.time)}`;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    finisherState.time--;
    if (finisherState.time <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerContainer.textContent = '00:00';
      moveEl.textContent = '';
    } else {
      timerContainer.textContent = `${t('timerLabel')} ${formatTime(finisherState.time)}`;
      if (finisherState.time % 30 === 0 && finisherState.moves.length) {
        finisherState.moveIndex = (finisherState.moveIndex + 1) % finisherState.moves.length;
        const m = finisherState.moves[finisherState.moveIndex];
        moveEl.textContent = `${m.name} x ${m.reps}`;
      }
    }
  }, 1000);
}

function pauseFinisherTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  } else if (finisherState.time > 0) {
    timerInterval = setInterval(() => {
      finisherState.time--;
      if (finisherState.time <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById('timerContainer').textContent = '00:00';
        document.getElementById('currentMove').textContent = '';
      } else {
        document.getElementById('timerContainer').textContent = `${t('timerLabel')} ${formatTime(finisherState.time)}`;
        if (finisherState.time % 30 === 0 && finisherState.moves.length) {
          finisherState.moveIndex = (finisherState.moveIndex + 1) % finisherState.moves.length;
          const m = finisherState.moves[finisherState.moveIndex];
          document.getElementById('currentMove').textContent = `${m.name} x ${m.reps}`;
        }
      }
    }, 1000);
  }
}

function resetFinisherTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  finisherState.time = 7 * 60;
  finisherState.moveIndex = 0;
  const timerContainer = document.getElementById('timerContainer');
  const moveEl = document.getElementById('currentMove');
  timerContainer.textContent = '07:00';
  moveEl.textContent = '';
}

// Helper to format seconds into MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ----------------------------- CSV Export ------------------------------------

/*
  exportCSV(): void

  Collects the current workout plan and user inputs (weights, checklist)
  and serialises them into CSV format. It then triggers a download by
  creating a temporary anchor element. Only the currently displayed day
  is exported; if you need to export the entire training history you
  could extend this function to iterate over ``appState.logs``.
*/
function exportCSV() {
  const rows = [];
  // CSV header
  rows.push(['Exercise', 'Focus', 'Sets', 'Reps', 'Weight', 'Notes'].join(','));
  // Gather data from weight inputs (table or cards)
  const inputs = document.querySelectorAll('input[data-type="weight"]');
  const seed = appState.seedWeek + hashCode(appState.dayKey);
  const plan = generateDailyPlan(appState.dayKey, appState.level, seed, appState.workoutStyle);
  // Build array of exercise objects in order: compound then accessories
  const exObjects = [plan.compound, ...plan.accessories];
  const weightMap = {};
  inputs.forEach((input) => {
    weightMap[input.dataset.index] = input.value || '';
  });
  exObjects.forEach((ex, idx) => {
    const key = idx === 0 ? 'compound' : String(idx - 1);
    const weight = weightMap[key] || '';
    rows.push([
      escapeForCSV(ex.exercise),
      escapeForCSV(ex.focus),
      ex.sets,
      escapeForCSV(ex.repsRange),
      escapeForCSV(weight),
      escapeForCSV(ex.notes)
    ].join(','));
  });
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yodha-plan-${appState.dayKey}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert(t('downloadComplete'));
}

// Escape fields so that embedded commas/quotes do not break CSV structure.
function escapeForCSV(value) {
  const str = value.toString();
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function showStyleScreen() {
  document.getElementById('styleScreen')?.classList.remove('hidden');
  document.getElementById('app')?.classList.add('hidden');
  window.scrollTo(0, 0);
}

function hideStyleScreen() {
  document.getElementById('styleScreen')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
}

function renderHeaderStyleTag() {
  const el = document.getElementById('selectedStyleTag');
  if (!el) return;
  const map = {
    home: 'styleHome',
    gym: 'styleGym',
    cardio: 'styleCardio',
    recovery: 'styleRecovery'
  };
  el.textContent = appState.workoutStyle ? t(map[appState.workoutStyle]) : '';
}

// ----------------------------- App Initialisation ----------------------------

// Execute when the DOM is fully loaded.
// ``window`` is only defined in browser contexts; guard against executing
// browser‑specific logic when the module is imported in Node (e.g. for tests).
if (typeof window !== 'undefined' && window.addEventListener) {
  function init() {
    loadState();

    document.querySelectorAll('.style-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-style');
        appState.workoutStyle = val;
        save('workoutStyle', val);
        hideStyleScreen();
        render();
      });
    });

    if (!appState.workoutStyle) {
      showStyleScreen();
    } else {
      hideStyleScreen();
      render();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .catch((error) => console.error('Service worker registration failed:', error));
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(render, 200);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
}