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
  const factor = (level === 'Beginner' ? 0.8 : level === 'Intermediate' ? 1 : 1.25) * intensityBias;
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
  const accessories = plan.blocks.flatMap((block) => block.exercises || []);
  const totalSets = accessories.reduce((acc, ex) => acc + (typeof ex.sets === 'number' ? ex.sets : 1), 0);
  const estimated = base + hiit + totalSets * perSet;
  const updatedPlan = { ...plan, estimatedMinutes: roundDuration(estimated) };
  if (updatedPlan.estimatedMinutes > 70) {
    updatedPlan.blocks = updatedPlan.blocks.map((block) => {
      if (!block.exercises) return block;
      return {
        ...block,
        exercises: block.exercises.map((exercise) => {
          if (typeof exercise.sets === 'number' && exercise.sets > 2) {
            return { ...exercise, sets: exercise.sets - 1 };
          }
          return exercise;
        }),
      };
    });
    const reducedSets = updatedPlan.blocks.flatMap((block) => block.exercises || [])
      .reduce((acc, ex) => acc + (typeof ex.sets === 'number' ? ex.sets : 1), 0);
    updatedPlan.estimatedMinutes = roundDuration(base + hiit + reducedSets * perSet);
  }
  return updatedPlan;
}

function buildCalisthenicsBlock(rand, intensityBias = 1, level = 'Beginner') {
  const shuffled = [...CALISTHENICS_MOVES].sort(() => rand() - 0.5);
  const baseSets = level === 'Beginner' ? 2 : level === 'Intermediate' ? 3 : 4;
  const sets = Math.max(2, Math.round(baseSets * intensityBias));
  return {
    title: 'Calisthenics mastery',
    type: 'calisthenics',
    exercises: shuffled.slice(0, 4).map((move) => ({ ...move, sets, reps: move.reps || '8–12' })),
  };
}

/* -------------------------------------------------------------------------- */
/* Plan generator                                                              */
/* -------------------------------------------------------------------------- */

class WorkoutLibrary {
  constructor() {
    this.hiit = HIIT_LIBRARY;
  }

  getCalisthenicsBlock(rand, intensityBias, level) {
    return buildCalisthenicsBlock(rand, intensityBias, level);
  }

  getGymPlan(format, mode) {
    return GYM_LIBRARY[format][mode];
  }

  getHomePlan(equipment, split) {
    if (equipment === 'minimal') return HOME_LIBRARY.minimal.total;
    if (equipment === 'calisthenics') return HOME_LIBRARY.calisthenics.flow;
    return HOME_LIBRARY.dumbbell[split];
  }

  getOutdoorPlan(equipment) {
    return OUTDOOR_LIBRARY[equipment].plan;
  }

  buildCustomForMuscles(muscles, context) {
    const exercises = [];
    muscles.forEach((muscle) => {
      const catalog = CUSTOM_LIBRARY[muscle];
      if (!catalog) return;
      exercises.push(...catalog[context]);
    });
    return exercises;
  }
}

class PlanGenerator {
  constructor(library) {
    this.library = library;
  }

  generate(date = new Date(), options = {}) {
    const {
      style = 'gym',
      level = 'Beginner',
      goal = 'strength',
      equipment = 'freeweight',
      intensityBias = 1,
      customMuscles = [],
    } = options;

    const dayIndex = dayIndexFromDate(date);
    const rand = seededRandom(dayIndex + 1);
    const rotationPhase = dayIndex % 6;

    let plan;
    if (style === 'custom') {
      plan = this.generateCustomPlan({ customMuscles, level, intensityBias, rand, equipment });
    } else if (style === 'gym') {
      plan = this.generateGymPlan({ rotationPhase, level, intensityBias, rand });
    } else if (style === 'home') {
      plan = this.generateHomePlan({ rotationPhase, level, intensityBias, equipment, rand });
    } else {
      plan = this.generateOutdoorPlan({ rotationPhase, level, intensityBias, equipment, rand });
    }

    const hiit = randomFrom(this.library.hiit, rand);
    const calisthenicsBlock = plan.blocks.find((b) => b.type === 'calisthenics');
    if (calisthenicsBlock) {
      calisthenicsBlock.exercises = calisthenicsBlock.exercises.map((exercise) => ({
        ...exercise,
        reps: exercise.reps || '6–10',
      }));
    }

    const goalFocus = GOAL_FOCUS[goal] || GOAL_FOCUS.strength;
    const finalPlan = ensurePlanDuration({
      ...plan,
      style,
      level,
      goal,
      equipment,
      goalFocus,
      hiit,
      date: date.toISOString().slice(0, 10),
      intensityBias,
    });
    return finalPlan;
  }

  generateGymPlan({ rotationPhase, level, intensityBias, rand }) {
    const order = ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
    const format = order[rotationPhase % order.length];
    const mode = rotationPhase % 6 < 3 ? 'volume' : 'size';
    const raw = this.library.getGymPlan(format, mode);
    const adjusted = adjustSetsForLevel(raw, level, intensityBias).map((exercise) => {
      if (mode === 'volume' && typeof exercise.sets === 'number') {
        return { ...exercise, tempo: 'Controlled 3-1-1', rest: '90s' };
      }
      if (mode === 'size' && typeof exercise.sets === 'number') {
        return { ...exercise, tempo: 'Explosive concentric', rest: '75s' };
      }
      return exercise;
    });
    return {
      format,
      mode,
      blocks: [
        { title: 'Primary lifts', exercises: adjusted.slice(0, 3) },
        { title: 'Accessory rotation', exercises: adjusted.slice(3) },
        this.library.getCalisthenicsBlock(rand, intensityBias, level),
      ],
    };
  }

  generateHomePlan({ rotationPhase, level, intensityBias, equipment, rand }) {
    if (equipment === 'calisthenics') {
      return {
        format: 'calisthenics',
        mode: 'skill',
        blocks: [this.library.getCalisthenicsBlock(rand, intensityBias, level)],
      };
    }
    if (equipment === 'minimal') {
      const plan = this.library.getHomePlan('minimal');
      return {
        format: 'total body',
        mode: 'bodyweight',
        blocks: [
          { title: 'Full-body flow', exercises: adjustSetsForLevel(plan, level, intensityBias) },
          this.library.getCalisthenicsBlock(rand, intensityBias, level),
        ],
      };
    }
    const split = rotationPhase % 2 === 0 ? 'upper' : 'lower';
    const plan = this.library.getHomePlan('dumbbell', split);
    return {
      format: split,
      mode: 'dumbbell',
      blocks: [
        { title: `${split === 'upper' ? 'Upper' : 'Lower'} power`, exercises: adjustSetsForLevel(plan, level, intensityBias) },
        this.library.getCalisthenicsBlock(rand, intensityBias, level),
      ],
    };
  }

  generateOutdoorPlan({ level, intensityBias, equipment, rand }) {
    if (equipment === 'calisthenics') {
      return {
        format: 'calisthenics',
        mode: 'skill',
        blocks: [this.library.getCalisthenicsBlock(rand, intensityBias, level)],
      };
    }
    const plan = this.library.getOutdoorPlan(equipment);
    return {
      format: equipment,
      mode: 'endurance',
      blocks: [
        { title: equipment === 'running' ? 'Track session' : 'Pool session', exercises: adjustSetsForLevel(plan, level, intensityBias) },
        this.library.getCalisthenicsBlock(rand, intensityBias, level),
      ],
    };
  }

  generateCustomPlan({ customMuscles, level, intensityBias, rand, equipment }) {
    const muscles = customMuscles.length ? customMuscles : ['chest', 'back'];
    const context = equipment === 'machines' || equipment === 'freeweight' ? 'gym'
      : equipment === 'dumbbell' || equipment === 'minimal' || equipment === 'calisthenics' ? 'home'
      : 'outdoor';
    const exercises = this.library.buildCustomForMuscles(muscles, context);
    const accessoryBlock = adjustSetsForLevel(exercises.slice(3), level, intensityBias);
    const mainBlock = adjustSetsForLevel(exercises.slice(0, 3), level, intensityBias).map((exercise) => ({
      ...exercise,
      main: true,
    }));

    const categories = new Set(muscles.map((id) => CUSTOM_LIBRARY[id]?.category).filter(Boolean));
    let format = 'custom';
    if (categories.has('push') && categories.size === 1) format = 'push';
    else if (categories.has('pull') && categories.size === 1) format = 'pull';
    else if (categories.has('legs') && categories.size === 1) format = 'legs';

    const blocks = [
      { title: 'Primary focus', exercises: mainBlock },
    ];
    if (accessoryBlock.length) {
      blocks.push({ title: 'Volume builder', exercises: accessoryBlock });
    }
    blocks.push(this.library.getCalisthenicsBlock(rand, intensityBias, level));

    return {
      format,
      mode: 'muscle-selection',
      blocks,
    };
  }
}

const library = new WorkoutLibrary();
const generator = new PlanGenerator(library);

function generateWorkoutPlan(date = new Date(), options = {}) {
  return generator.generate(date, options);
}

/* -------------------------------------------------------------------------- */
/* Profile + History management                                               */
/* -------------------------------------------------------------------------- */

class ProfileManager {
  constructor(store) {
    this.store = store;
    this.state = this.load();
  }

  load() {
    const defaults = {
      user: { name: 'Warrior' },
      lang: 'en',
      style: 'gym',
      lastGuidedStyle: 'gym',
      level: 'Beginner',
      goal: 'strength',
      equipment: 'freeweight',
      format: 'push',
      intensityBias: 1,
      logs: [],
      planCache: {},
      customMuscles: [],
      sessionCounts: { Beginner: 0, Intermediate: 0, Advanced: 0 },
    };
    const saved = this.store.load('profile', {});
    return {
      ...defaults,
      ...saved,
      sessionCounts: { ...defaults.sessionCounts, ...(saved.sessionCounts || {}) },
    };
  }

  persist() {
    this.store.save('profile', this.state);
  }

  recordSession(plan, feedback, weights, notes) {
    const previousLevel = this.state.level;
    const entry = {
      date: new Date().toISOString().slice(0, 10),
      plan,
      feedback,
      weights,
      notes,
      mainLiftWeight: this.determineMainLiftWeight(weights, plan),
    };
    this.state.logs = this.state.logs.filter((log) => log.date !== entry.date);
    this.state.logs.push(entry);
    this.bumpSessionCounter();
    const levelUp = this.state.level !== previousLevel ? { from: previousLevel, to: this.state.level } : null;
    this.persist();
    return { entry, levelUp };
  }

  bumpSessionCounter() {
    const currentLevel = this.state.level;
    const today = todayKey();
    const todayPlan = this.state.planCache?.[today];
    if (!this.state.sessionCounts[currentLevel]) this.state.sessionCounts[currentLevel] = 0;
    this.state.sessionCounts[currentLevel] += 1;

    const threshold = LEVEL_THRESHOLDS[currentLevel];
    if (threshold && this.state.sessionCounts[currentLevel] >= threshold) {
      if (currentLevel === 'Beginner') {
        this.state.level = 'Intermediate';
      } else if (currentLevel === 'Intermediate') {
        this.state.level = 'Advanced';
      }
      this.state.sessionCounts[this.state.level] = this.state.sessionCounts[this.state.level] || 0;
      this.state.planCache = todayPlan ? { [today]: todayPlan } : {};
    }
  }

  determineMainLiftWeight(weights, plan) {
    const mainIndices = [];
    plan.blocks.forEach((block, blockIndex) => {
      (block.exercises || []).forEach((exercise, index) => {
        if (exercise.main) {
          mainIndices.push({ blockIndex, index });
        }
      });
    });
    const entries = weights.filter((entry) => mainIndices.some((mi) => mi.blockIndex === entry.block && mi.index === entry.index));
    if (!entries.length) return null;
    return entries.reduce((acc, entry) => acc + entry.weight, 0) / entries.length;
  }

  adjustIntensity(feedback) {
    if (feedback === 'easy') this.state.intensityBias = Math.min(1.4, this.state.intensityBias + 0.05);
    if (feedback === 'hard') this.state.intensityBias = Math.max(0.7, this.state.intensityBias - 0.05);
    this.persist();
  }

  cachePlan(plan) {
    const key = plan.date;
    this.state.planCache[key] = plan;
    this.persist();
  }

  loadCachedPlan(dateKey) {
    return this.state.planCache[dateKey];
  }

  clearOldPlan(dateKey) {
    this.state.planCache = { [dateKey]: this.state.planCache[dateKey] };
    this.persist();
  }

  updateSelection(updates) {
    if (Object.prototype.hasOwnProperty.call(updates, 'style')) {
      if (updates.style && updates.style !== 'custom') {
        this.state.lastGuidedStyle = updates.style;
      } else if (!this.state.lastGuidedStyle) {
        this.state.lastGuidedStyle = 'gym';
      }
    }
    this.state = { ...this.state, ...updates };
    this.persist();
  }

  get logs() {
    return [...this.state.logs];
  }
}

const profileManager = new ProfileManager(storageService);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function ensureTodayPlan() {
  const key = todayKey();
  const cached = profileManager.loadCachedPlan(key);
  const needsRefresh = !cached
    || cached.style !== profileManager.state.style
    || cached.level !== profileManager.state.level
    || cached.goal !== profileManager.state.goal
    || cached.equipment !== profileManager.state.equipment
    || JSON.stringify(cached.customMuscles || []) !== JSON.stringify(profileManager.state.customMuscles || []);

  if (needsRefresh) {
    const plan = generateWorkoutPlan(new Date(), profileManager.state);
    profileManager.cachePlan({ ...plan, customMuscles: profileManager.state.customMuscles });
    return plan;
  }
  return cached;
}

/* -------------------------------------------------------------------------- */
/* UI: helpers                                                                 */
/* -------------------------------------------------------------------------- */

const $ = doc ? (selector) => doc.querySelector(selector) : () => null;
const $$ = doc ? (selector) => Array.from(doc.querySelectorAll(selector)) : () => [];

function fmtTime(date) {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

function computeStreak(logs) {
  if (!logs.length) return 0;
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1));
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

function renderHistory(logs) {
  if (!doc) return;
  const list = $('#historyList');
  if (!list) return;
  list.innerHTML = '';
  const sorted = [...logs].sort((a, b) => (a.date > b.date ? -1 : 1)).slice(0, 6);
  if (!sorted.length) {
    const empty = doc.createElement('li');
    empty.textContent = 'No sessions logged yet — your graph will appear here once you complete a workout.';
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

function renderProgressChart(logs) {
  if (!doc) return;
  const canvas = $('#progressChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const data = logs
    .filter((entry) => entry.mainLiftWeight)
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  if (!data.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Log main lift weights to see the graph', 20, canvas.height / 2);
    return;
  }

  const padding = 30;
  const min = Math.min(...data.map((entry) => entry.mainLiftWeight));
  const max = Math.max(...data.map((entry) => entry.mainLiftWeight));
  const range = Math.max(10, max - min);

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  ctx.strokeStyle = '#6ad4ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  data.forEach((entry, index) => {
    const x = padding + (index / Math.max(1, data.length - 1)) * (canvas.width - padding * 2);
    const y = canvas.height - padding - ((entry.mainLiftWeight - min) / range) * (canvas.height - padding * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#6ad4ff';
  data.forEach((entry, index) => {
    const x = padding + (index / Math.max(1, data.length - 1)) * (canvas.width - padding * 2);
    const y = canvas.height - padding - ((entry.mainLiftWeight - min) / range) * (canvas.height - padding * 2);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function formatPlanSummary(plan) {
  const focus = plan.goalFocus.slice(0, 2).join(' · ');
  return `${plan.style.toUpperCase()} · ${plan.format.toUpperCase()} · ${focus}`;
}

/* -------------------------------------------------------------------------- */
/* Muscle selector UI component                                               */
/* -------------------------------------------------------------------------- */

class MuscleSelector {
  constructor(layout) {
    this.layout = layout;
    this.selected = new Set();
  }

  init(container) {
    if (!doc || !container) return;
    container.innerHTML = '';
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 420');
    svg.setAttribute('class', 'muscle-map');

    this.layout.forEach((region) => {
      const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', region.path);
      path.dataset.muscle = region.id;
      path.setAttribute('class', 'muscle-region');
      path.addEventListener('click', () => this.toggle(region.id, path));
      svg.appendChild(path);
    });

    container.appendChild(svg);
    this.renderChipList(container);
  }

  toggle(id, pathNode) {
    if (this.selected.has(id)) {
      this.selected.delete(id);
      if (pathNode) pathNode.classList.remove('active');
    } else if (this.selected.size < 3) {
      this.selected.add(id);
      if (pathNode) pathNode.classList.add('active');
    }
    this.updateChips();
  }

  renderChipList(container) {
    this.chipContainer = doc.createElement('div');
    this.chipContainer.className = 'chip-container';
    container.appendChild(this.chipContainer);
    this.updateChips();
  }

  updateChips() {
    if (!this.chipContainer) return;
    this.chipContainer.innerHTML = '';
    if (!this.selected.size) {
      const empty = doc.createElement('span');
      empty.className = 'chip chip--ghost';
      empty.textContent = 'Select up to three focus muscles';
      this.chipContainer.appendChild(empty);
      return;
    }
    Array.from(this.selected).forEach((id) => {
      const chip = doc.createElement('button');
      chip.type = 'button';
      chip.className = 'chip chip--pill';
      chip.textContent = CUSTOM_LIBRARY[id]?.label || id;
      chip.addEventListener('click', () => {
        this.selected.delete(id);
        const pathNode = doc.querySelector(`.muscle-region[data-muscle="${id}"]`);
        if (pathNode) pathNode.classList.remove('active');
        this.updateChips();
      });
      this.chipContainer.appendChild(chip);
    });
  }

  value() {
    return Array.from(this.selected);
  }

  setValue(muscles) {
    this.selected = new Set(muscles);
    $$('.muscle-region').forEach((node) => {
      if (this.selected.has(node.dataset.muscle)) node.classList.add('active');
      else node.classList.remove('active');
    });
    this.updateChips();
  }
}

/* -------------------------------------------------------------------------- */
/* Planner UI                                                                 */
/* -------------------------------------------------------------------------- */

class PlannerUI {
  constructor(profile, planGenerator, muscleSelector) {
    this.profile = profile;
    this.generator = planGenerator;
    this.muscleSelector = muscleSelector;
    this.currentPlan = null;
    this.lastGuidedStyle = this.profile.state.lastGuidedStyle
      || (this.profile.state.style === 'custom' ? 'gym' : this.profile.state.style);
  }

  init() {
    if (!doc) return;
    this.cacheDom();
    this.bindEvents();
    this.handleCustomToggle();
    this.activateStep(0);
    this.renderWelcome();
    this.renderPlanScreen();
    renderHistory(this.profile.logs);
    renderProgressChart(this.profile.logs);
    this.tickClock();
  }

  cacheDom() {
    this.welcomeScreen = $('#screen-welcome');
    this.planScreen = $('#screen-plan');
    this.startBtn = $('#btnStartExperience');
    this.nextStepBtns = $$('.btn-step');
    this.levelSelect = $('#levelSelect');
    this.styleButtons = $$('.style-option');
    this.goalSelect = $('#goalSelect');
    this.equipmentSelect = $('#equipmentSelect');
    this.customToggle = $('#customBuilderToggle');
    this.customBuilderPanel = $('#customBuilderPanel');
    this.muscleContainer = $('#muscleSelector');
    this.planBlocks = $('#planBlocks');
    this.hiitList = $('#hiitList');
    this.goalFocusList = $('#goalFocusList');
    this.planFocus = $('#planFocus');
    this.planRotation = $('#planRotation');
    this.planDuration = $('#planDuration');
    this.motivationText = $('#motivationQuote');
    this.stepper = $('#flowStepper');
  }

  bindEvents() {
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        this.activateStep(1);
      });
    }

    this.nextStepBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = Number(btn.dataset.nextStep || '2');
        if (step === 2) {
          this.handleCustomToggle();
        }
        if (step === 3) {
          this.updateStateFromSelectors();
          this.renderPlanScreen(true);
        }
        this.activateStep(step);
      });
    });

    if (this.levelSelect) {
      this.levelSelect.value = this.profile.state.level;
      this.levelSelect.addEventListener('change', () => {
        this.profile.updateSelection({ level: this.levelSelect.value });
        this.renderPlanScreen(true);
      });
    }

    if (this.goalSelect) {
      this.goalSelect.value = this.profile.state.goal;
      this.goalSelect.addEventListener('change', () => {
        this.profile.updateSelection({ goal: this.goalSelect.value });
        this.renderPlanScreen(true);
      });
    }

    if (this.equipmentSelect) {
      this.updateEquipmentOptions();
      this.equipmentSelect.addEventListener('change', () => {
        this.profile.updateSelection({ equipment: this.equipmentSelect.value });
        this.renderPlanScreen(true);
      });
    }

    if (this.customToggle) {
      this.customToggle.checked = this.profile.state.style === 'custom';
      this.customToggle.addEventListener('change', () => {
        const style = this.customToggle.checked ? 'custom' : (this.profile.state.lastGuidedStyle || this.lastGuidedStyle || 'gym');
        this.profile.updateSelection({ style });
        this.lastGuidedStyle = this.profile.state.lastGuidedStyle || this.lastGuidedStyle;
        this.handleCustomToggle();
        this.updateEquipmentOptions();
        this.renderPlanScreen(true);
      });
    }

    this.styleButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const style = btn.dataset.style;
        this.profile.updateSelection({ style });
        if (style !== 'custom') {
          this.lastGuidedStyle = style;
        }
        this.customToggle.checked = style === 'custom';
        this.handleCustomToggle();
        this.updateEquipmentOptions();
        this.renderPlanScreen(true);
        this.styleButtons.forEach((b) => b.classList.toggle('style-option--active', b === btn));
      });
      if (btn.dataset.style === this.profile.state.style) {
        btn.classList.add('style-option--active');
      }
    });

    $('#btnMarkDone')?.addEventListener('click', () => this.submitFeedback());
    $('#btnBackHome')?.addEventListener('click', () => this.activateStep(0));
    $('#linkChangeStyle')?.addEventListener('click', () => this.activateStep(1));
  }

  handleCustomToggle() {
    if (!this.muscleContainer) return;
    if (this.profile.state.style === 'custom') {
      this.muscleSelector.init(this.muscleContainer);
      this.muscleSelector.setValue(this.profile.state.customMuscles || []);
      this.customBuilderPanel?.classList.remove('hidden');
    } else {
      this.customBuilderPanel?.classList.add('hidden');
    }
  }

  updateStateFromSelectors() {
    const muscles = this.profile.state.style === 'custom' ? this.muscleSelector.value() : [];
    this.profile.updateSelection({ customMuscles: muscles });
  }

  activateStep(step) {
    if (!doc) return;
    this.stepper?.querySelectorAll('[data-step]').forEach((node) => {
      node.classList.toggle('active', Number(node.dataset.step) === step);
      node.classList.toggle('completed', Number(node.dataset.step) < step);
    });

    $('#step-landing')?.classList.toggle('hidden', step !== 0);
    $('#step-experience')?.classList.toggle('hidden', step !== 1);
    $('#step-level')?.classList.toggle('hidden', step !== 2);
    $('#step-plan')?.classList.toggle('hidden', step !== 3);
  }

  tickClock() {
    if (!doc) return;
    const node = $('#timeVal');
    if (node) node.textContent = fmtTime(new Date());
    setTimeout(() => this.tickClock(), 60000);
  }

  renderWelcome() {
    if (!doc) return;
    $('#welcomeTitle').textContent = `Welcome back, ${this.profile.state.user.name}`;
    $('#streakVal').textContent = computeStreak(this.profile.logs);
    const lastLog = [...this.profile.logs].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    $('#lastWorkoutVal').textContent = lastLog ? `${lastLog.plan.style} · ${lastLog.plan.format}` : '—';
    $('#lastStyleChip').textContent = formatPlanSummary(ensureTodayPlan());
    $('#motivationQuote').textContent = randomFrom(MOTIVATIONAL_QUOTES, Math.random);
  }

  updateEquipmentOptions() {
    if (!doc || !this.equipmentSelect) return;
    const options = this.profile.state.style === 'custom'
      ? CUSTOM_EQUIPMENT_OPTIONS
      : (EQUIPMENT_VARIANTS[this.profile.state.style] || ['freeweight']);
    this.equipmentSelect.innerHTML = '';
    options.forEach((option) => {
      const opt = doc.createElement('option');
      opt.value = option;
      opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
      this.equipmentSelect.appendChild(opt);
    });
    if (!options.includes(this.profile.state.equipment)) {
      this.profile.updateSelection({ equipment: options[0] });
    }
    this.equipmentSelect.value = this.profile.state.equipment;
  }

  renderPlanScreen(force = false) {
    if (!doc) return;
    if (!force && this.currentPlan) return;
    this.currentPlan = ensureTodayPlan();
    if (force) {
      this.currentPlan = generateWorkoutPlan(new Date(), this.profile.state);
      this.profile.cachePlan({ ...this.currentPlan, customMuscles: this.profile.state.customMuscles });
    }
    this.drawPlan(this.currentPlan);
    if (force) {
      this.renderWelcome();
    }
  }

  drawPlan(plan) {
    if (!doc) return;
    this.planBlocks.innerHTML = '';
    this.planFocus.textContent = formatPlanSummary(plan);
    this.planRotation.textContent = `${plan.mode.toUpperCase()} rotation`;
    this.planDuration.textContent = `${plan.estimatedMinutes} minutes`;    

    this.goalFocusList.innerHTML = '';
    plan.goalFocus.forEach((item) => {
      const li = doc.createElement('li');
      li.textContent = item;
      this.goalFocusList.appendChild(li);
    });

    plan.blocks.forEach((block, blockIndex) => {
      const section = doc.createElement('section');
      section.className = 'card workout-block';
      section.innerHTML = `
        <header class="card__header">
          <h3 class="headline-sm">${block.title}</h3>
        </header>
      `;
      const list = doc.createElement('ol');
      list.className = 'exercise-list';
      (block.exercises || []).forEach((exercise, exerciseIndex) => {
        const item = doc.createElement('li');
        item.innerHTML = `
          <div class="exercise-name">${exercise.name}${exercise.main ? ' · <span class="tag">Main</span>' : ''}</div>
          <div class="exercise-meta">${exercise.sets ? `${exercise.sets} sets` : ''} ${exercise.reps ? `· ${exercise.reps}` : ''}</div>
        `;
        const weightInput = doc.createElement('input');
        weightInput.type = 'number';
        weightInput.placeholder = 'Load (kg)';
        weightInput.className = 'input weight-input';
        weightInput.dataset.block = blockIndex;
        weightInput.dataset.index = exerciseIndex;
        item.appendChild(weightInput);
        list.appendChild(item);
      });
      section.appendChild(list);
      this.planBlocks.appendChild(section);
    });

    this.hiitList.innerHTML = '';
    plan.hiit.forEach((movement) => {
      const li = doc.createElement('li');
      li.textContent = movement;
      this.hiitList.appendChild(li);
    });
  }

  collectWeights() {
    const weights = [];
    $$('.weight-input').forEach((input) => {
      if (input.value) {
        weights.push({ block: Number(input.dataset.block), index: Number(input.dataset.index), weight: Number(input.value) });
      }
    });
    return weights;
  }

  submitFeedback() {
    const plan = this.currentPlan || ensureTodayPlan();
    const weights = this.collectWeights();
    const feedback = $('input[name="feedback"]:checked')?.value || 'good';
    const notes = $('#feedbackNotes').value.trim();
    const { levelUp } = this.profile.recordSession(plan, feedback, weights, notes);
    this.profile.adjustIntensity(feedback);
    renderHistory(this.profile.logs);
    renderProgressChart(this.profile.logs);
    this.renderWelcome();
    if (this.levelSelect) {
      this.levelSelect.value = this.profile.state.level;
    }
    let message = 'Feedback stored. Tomorrow’s plan will adapt.';
    if (levelUp) {
      message += ` Level advanced from ${levelUp.from} to ${levelUp.to}.`;
      this.renderPlanScreen(true);
    }
    alert(message);
    this.activateStep(0);
  }
}

/* -------------------------------------------------------------------------- */
/* Bootstrapping                                                              */
/* -------------------------------------------------------------------------- */

if (doc) {
  const muscleSelector = new MuscleSelector(MUSCLE_LAYOUT);
  const planner = new PlannerUI(profileManager, generator, muscleSelector);
  planner.init();
}

module.exports = {
  generateWorkoutPlan,
  HIIT_LIBRARY,
  CALISTHENICS_MOVES,
  CUSTOM_LIBRARY,
  MOTIVATIONAL_QUOTES,
};
