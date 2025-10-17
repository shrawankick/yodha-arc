/*
 * Yodha Arc — Advanced adaptive workout platform with custom muscle builder.
 * The architecture uses small classes to keep responsibilities clear:
 *  - StorageService handles persistence.
 *  - ProfileManager tracks user level progression and feedback.
 *  - WorkoutLibrary exposes all exercise catalogs.
 *  - PlanGenerator builds day-specific training plans (gym/home/outdoor/custom).
 *  - MuscleSelector + PlannerUI manage the interface workflow when running in the browser.
 */

const doc = typeof document !== 'undefined' ? document : null;

/* -------------------------------------------------------------------------- */
/* Storage and state helpers                                                   */
/* -------------------------------------------------------------------------- */

class StorageService {
  constructor(adapter) {
    this.adapter = adapter || (typeof localStorage !== 'undefined' ? localStorage : null);
  }

  load(key, fallback = null) {
    if (!this.adapter) return fallback;
    try {
      const raw = this.adapter.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn('Failed loading key', key, error);
      return fallback;
    }
  }

  save(key, value) {
    if (!this.adapter) return;
    try {
      this.adapter.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed saving key', key, error);
    }
  }
}

const storageService = new StorageService();

/* -------------------------------------------------------------------------- */
/* Core data catalog                                                           */
/* -------------------------------------------------------------------------- */

const MOTIVATIONAL_QUOTES = [
  'Discipline carves the warrior you wish to become.',
  'Steel is forged under pressure—so are you.',
  'Consistency beats intensity when intensity is inconsistent.',
  'Today’s volume becomes tomorrow’s confidence.',
  'You do not rise to the level of your goals, you fall to the level of your rituals.',
  'Every rep is a receipt for the future you are buying.'
];

const HIIT_LIBRARY = [
  ['Battle rope slams', 'Burpee broad jumps', 'Kettlebell snatches', 'Mountain climbers', 'Skater hops', 'Plank shoulder taps', 'High knees sprint'],
  ['Rowing sprint', 'Box jump overs', 'Medicine ball slams', 'Jump lunges', 'Push-up jacks', 'Hollow body rocks', 'Speed skaters'],
  ['Jump rope sprint', 'Lateral bounds', 'Thrusters', 'Bear crawl', 'Tuck jumps', 'Russian twists', 'Sprint in place'],
  ['Alternating kettlebell cleans', 'Boxer shuffle punches', 'Squat jump reach', 'Sprawl to row', 'Sprint ladder', 'Alternating V-ups', 'Plank jacks'],
];

const CALISTHENICS_MOVES = [
  { name: 'Ring rows', note: 'Gym/Home/Outdoor' },
  { name: 'Archer push-ups', note: 'Progressive strength' },
  { name: 'Pistol squat to box', note: 'Control depth' },
  { name: 'Hanging leg raises', note: 'Brace hard' },
  { name: 'Handstand hold', note: 'Kick-up or wall supported' },
  { name: 'Parallel bar dips', note: 'Slow tempo' },
  { name: 'Copenhagen plank', note: 'Adductors + core' },
  { name: 'Support hold', note: 'Rings or dip bars' },
];

const GOAL_FOCUS = {
  strength: ['Compound priority', 'Longer rest', 'Lower rep top sets'],
  hypertrophy: ['Mind-muscle connection', 'Moderate rest', 'Higher accessory volume'],
  fatloss: ['Paired circuits', 'Reduced rest', 'Keep heart rate high'],
  endurance: ['Tempo management', 'Breathing focus', 'RPE 7–8 sustained'],
};

const LEVEL_THRESHOLDS = {
  Beginner: 30,
  Intermediate: 40,
};

/* -------------------------------------------------------------------------- */
/* Libraries for guided plans                                                 */
/* -------------------------------------------------------------------------- */

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

const EQUIPMENT_VARIANTS = {
  gym: ['freeweight', 'machines', 'calisthenics'],
  home: ['minimal', 'dumbbell', 'calisthenics'],
  outdoor: ['running', 'swimming', 'calisthenics'],
};

const CUSTOM_EQUIPMENT_OPTIONS = ['freeweight', 'machines', 'dumbbell', 'minimal', 'running', 'swimming', 'calisthenics'];

/* Custom muscle library: each muscle group offers exercises across contexts */
const CUSTOM_LIBRARY = {
  chest: {
    label: 'Chest',
    category: 'push',
    gym: [
      { name: 'Flat Barbell Press', sets: 4, reps: '6–8', main: true },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8–12' },
      { name: 'Cable Fly', sets: 3, reps: '12–15' },
    ],
    home: [
      { name: 'Feet-elevated Push-up', sets: 4, reps: '12' },
      { name: 'Pseudo Planche Push-up', sets: 3, reps: '8–10' },
      { name: 'Resistance Band Fly', sets: 3, reps: '15' },
    ],
    outdoor: [
      { name: 'Parallel Bar Dips', sets: 4, reps: '8–12', main: true },
      { name: 'Push-up Ladder', sets: 3, reps: 'Max reps' },
      { name: 'Explosive Clap Push-up', sets: 3, reps: '10' },
    ],
  },
  shoulders: {
    label: 'Shoulders',
    category: 'push',
    gym: [
      { name: 'Seated DB Shoulder Press', sets: 4, reps: '8–10', main: true },
      { name: 'Cable Lateral Raise', sets: 4, reps: '12–15' },
      { name: 'Rear Delt Fly', sets: 3, reps: '15' },
    ],
    home: [
      { name: 'Pike Push-up', sets: 4, reps: '10–12', main: true },
      { name: 'Band Lateral Raise', sets: 3, reps: '15' },
      { name: 'Wall Handstand Hold', sets: 3, reps: '30s' },
    ],
    outdoor: [
      { name: 'Handstand Walk Practice', sets: 4, reps: '20m' },
      { name: 'Parallel Bar Support Hold', sets: 3, reps: '40s' },
      { name: 'Band Face Pull', sets: 3, reps: '20' },
    ],
  },
  triceps: {
    label: 'Triceps',
    category: 'push',
    gym: [
      { name: 'Close-grip Bench Press', sets: 4, reps: '6–8' },
      { name: 'Cable Rope Pressdown', sets: 4, reps: '12–15' },
      { name: 'Overhead EZ Extension', sets: 3, reps: '10–12' },
    ],
    home: [
      { name: 'Bench Dips', sets: 4, reps: '15' },
      { name: 'Diamond Push-up', sets: 3, reps: '12–15' },
      { name: 'Band Overhead Extension', sets: 3, reps: '20' },
    ],
    outdoor: [
      { name: 'Ring Push-down', sets: 3, reps: '12–15' },
      { name: 'Bodyweight Skull Crusher', sets: 3, reps: '10–12' },
      { name: 'Bench Dip Iso Hold', sets: 3, reps: '30s' },
    ],
  },
  back: {
    label: 'Back',
    category: 'pull',
    gym: [
      { name: 'Deadlift', sets: 4, reps: '5', main: true },
      { name: 'Weighted Pull-up', sets: 4, reps: '6–8' },
      { name: 'Chest-supported Row', sets: 4, reps: '10–12' },
    ],
    home: [
      { name: 'Inverted Row', sets: 4, reps: '12' },
      { name: 'Backpack Romanian Deadlift', sets: 3, reps: '15' },
      { name: 'Band Pulldown', sets: 3, reps: '20' },
    ],
    outdoor: [
      { name: 'Towel Pull-up', sets: 4, reps: 'Max' },
      { name: 'Horizontal Row Bar', sets: 3, reps: '12–15' },
      { name: 'Sprint Sled Row', sets: 3, reps: '30m' },
    ],
  },
  biceps: {
    label: 'Biceps',
    category: 'pull',
    gym: [
      { name: 'Barbell Curl', sets: 4, reps: '8–10' },
      { name: 'Incline Dumbbell Curl', sets: 3, reps: '10–12' },
      { name: 'Cable Curl Drop-set', sets: 3, reps: '15' },
    ],
    home: [
      { name: 'Band Curl', sets: 4, reps: '15' },
      { name: 'Backpack Curl', sets: 3, reps: '12' },
      { name: 'Isometric Curl Hold', sets: 3, reps: '30s' },
    ],
    outdoor: [
      { name: 'Suspension Trainer Curl', sets: 3, reps: '12' },
      { name: 'Bar Hang Curl', sets: 3, reps: '10' },
      { name: 'Partner Curl', sets: 2, reps: 'AMRAP' },
    ],
  },
  forearms: {
    label: 'Forearms',
    category: 'pull',
    gym: [
      { name: 'Reverse Curl', sets: 3, reps: '12–15' },
      { name: 'Farmer Carry', sets: 4, reps: '40m' },
      { name: 'Cable Wrist Curl', sets: 3, reps: '20' },
    ],
    home: [
      { name: 'Towel Grip Dead Hang', sets: 4, reps: '30s' },
      { name: 'Rice Bucket Twist', sets: 3, reps: '1 min' },
      { name: 'Backpack Hammer Curl', sets: 3, reps: '15' },
    ],
    outdoor: [
      { name: 'Rope Climb Practice', sets: 4, reps: '10m' },
      { name: 'Thick Bar Carry', sets: 3, reps: '30m' },
      { name: 'Sandbag Wrist Flexion', sets: 3, reps: '20' },
    ],
  },
  core: {
    label: 'Core',
    category: 'accessory',
    gym: [
      { name: 'Cable Woodchop', sets: 4, reps: '12/side' },
      { name: 'Weighted Plank', sets: 3, reps: '60s' },
      { name: 'Hanging Leg Raise', sets: 4, reps: '10–12' },
    ],
    home: [
      { name: 'Dragon Flag', sets: 3, reps: '6–8' },
      { name: 'Side Plank Reach', sets: 3, reps: '45s' },
      { name: 'Hollow Body Rock', sets: 3, reps: '20' },
    ],
    outdoor: [
      { name: 'L-sit on Parallel Bars', sets: 4, reps: '30s' },
      { name: 'Hanging Knee Raise', sets: 3, reps: '15' },
      { name: 'Med-ball Russian Twist', sets: 3, reps: '20' },
    ],
  },
  glutes: {
    label: 'Glutes',
    category: 'legs',
    gym: [
      { name: 'Barbell Hip Thrust', sets: 4, reps: '8–10', main: true },
      { name: 'Cable Kickback', sets: 3, reps: '15' },
      { name: 'Walking Lunge', sets: 3, reps: '12/leg' },
    ],
    home: [
      { name: 'Single-leg Glute Bridge', sets: 4, reps: '12/side' },
      { name: 'Band Monster Walk', sets: 3, reps: '20 steps' },
      { name: 'Rear-foot Elevated Split Squat', sets: 3, reps: '12/leg' },
    ],
    outdoor: [
      { name: 'Hill Sprint', sets: 8, reps: '10s', main: true },
      { name: 'Sandbag Carry', sets: 4, reps: '40m' },
      { name: 'Step-up Bench', sets: 3, reps: '15/leg' },
    ],
  },
  quads: {
    label: 'Quads',
    category: 'legs',
    gym: [
      { name: 'Back Squat', sets: 4, reps: '5–8', main: true },
      { name: 'Leg Press', sets: 4, reps: '12' },
      { name: 'Leg Extension', sets: 3, reps: '15' },
    ],
    home: [
      { name: 'Pistol Squat to Box', sets: 4, reps: '6/leg' },
      { name: 'Split Squat Pulse', sets: 3, reps: '15/leg' },
      { name: 'Jump Squat', sets: 3, reps: '12' },
    ],
    outdoor: [
      { name: 'Weighted Step-up', sets: 4, reps: '12/leg' },
      { name: 'Sled Push', sets: 6, reps: '20m' },
      { name: 'Sprint Acceleration', sets: 6, reps: '50m' },
    ],
  },
  hamstrings: {
    label: 'Hamstrings',
    category: 'legs',
    gym: [
      { name: 'Romanian Deadlift', sets: 4, reps: '8–10', main: true },
      { name: 'Nordic Curl', sets: 3, reps: '6–8' },
      { name: 'Seated Leg Curl', sets: 4, reps: '12–15' },
    ],
    home: [
      { name: 'Single-leg Romanian Deadlift', sets: 4, reps: '10/leg' },
      { name: 'Sliding Leg Curl', sets: 3, reps: '12' },
      { name: 'Band Good Morning', sets: 3, reps: '20' },
    ],
    outdoor: [
      { name: 'Glute-ham Raise Bench', sets: 3, reps: '10' },
      { name: 'Sprint Drills (A/B)', sets: 4, reps: '30m' },
      { name: 'Sandbag Romanian Deadlift', sets: 3, reps: '15' },
    ],
  },
  calves: {
    label: 'Calves',
    category: 'legs',
    gym: [
      { name: 'Seated Calf Raise', sets: 4, reps: '15–20' },
      { name: 'Leg Press Calf Raise', sets: 4, reps: '20' },
      { name: 'Single-leg Standing Calf Raise', sets: 3, reps: '15' },
    ],
    home: [
      { name: 'Tempo Calf Raise', sets: 4, reps: '20' },
      { name: 'Farmer Walk on Toes', sets: 3, reps: '30m' },
      { name: 'Jump Rope Burst', sets: 3, reps: '60s' },
    ],
    outdoor: [
      { name: 'Up-stair Bounding', sets: 6, reps: '1 flight' },
      { name: 'Weighted March on Toes', sets: 4, reps: '40m' },
      { name: 'Beach Sprint', sets: 5, reps: '60m' },
    ],
  },
};

const MUSCLE_LAYOUT = [
  { id: 'chest', label: 'Chest', path: 'M85 85 Q100 55 115 85 Q118 105 110 150 Q100 160 90 150 Z', side: 'front' },
  { id: 'shoulders', label: 'Shoulders', path: 'M70 60 Q100 20 130 60 Q120 70 100 70 Q80 70 70 60 Z', side: 'front' },
  { id: 'triceps', label: 'Triceps', path: 'M60 110 Q55 150 70 180 Q80 150 75 110 Z', side: 'front' },
  { id: 'back', label: 'Back', path: 'M85 85 Q100 45 115 85 Q120 125 115 180 Q100 190 85 180 Z', side: 'back' },
  { id: 'biceps', label: 'Biceps', path: 'M130 110 Q135 150 120 180 Q110 150 115 110 Z', side: 'front' },
  { id: 'forearms', label: 'Forearms', path: 'M52 180 Q48 220 60 260 Q70 220 66 180 Z', side: 'front' },
  { id: 'core', label: 'Core', path: 'M92 150 Q100 140 108 150 Q110 185 100 220 Q90 185 92 150 Z', side: 'front' },
  { id: 'glutes', label: 'Glutes', path: 'M85 220 Q100 200 115 220 Q118 250 100 270 Q82 250 85 220 Z', side: 'back' },
  { id: 'quads', label: 'Quads', path: 'M92 220 Q100 210 108 220 Q112 270 100 320 Q88 270 92 220 Z', side: 'front' },
  { id: 'hamstrings', label: 'Hamstrings', path: 'M88 220 Q100 215 112 220 Q115 280 100 330 Q85 280 88 220 Z', side: 'back' },
  { id: 'calves', label: 'Calves', path: 'M95 320 Q100 310 105 320 Q110 360 100 400 Q90 360 95 320 Z', side: 'front' },
];

const MUSCLE_COMBOS = [
  { id: 'push', label: 'Push power', muscles: ['chest', 'shoulders', 'triceps'] },
  { id: 'pull', label: 'Pull density', muscles: ['back', 'biceps', 'forearms'] },
  { id: 'legs', label: 'Lower body symphony', muscles: ['quads', 'hamstrings', 'calves'] },
  { id: 'athlete', label: 'Athlete engine', muscles: ['core', 'back', 'glutes'] },
];

/* -------------------------------------------------------------------------- */
/* Utility functions                                                           */
/* -------------------------------------------------------------------------- */

const baseDate = new Date('2025-01-01T00:00:00Z');
const dayIndexFromDate = (date) => Math.floor((date - baseDate) / 86400000);
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

    const selectedMuscles = Array.isArray(customMuscles)
      ? customMuscles.slice(0, 3)
      : [];

    const dayIndex = dayIndexFromDate(date);
    const rand = seededRandom(dayIndex + 1);
    const rotationPhase = dayIndex % 6;

    let plan;
    if (style === 'custom') {
      plan = this.generateCustomPlan({ customMuscles: selectedMuscles, level, intensityBias, rand, equipment });
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
      customMuscles: plan.customMuscles || selectedMuscles,
      selection: selectedMuscles,
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
      customMuscles: muscles,
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
      this.state.sessionCounts[currentLevel] = 0;
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
    || JSON.stringify(cached.selection || []) !== JSON.stringify(profileManager.state.customMuscles || []);

  if (needsRefresh) {
    const plan = generateWorkoutPlan(new Date(), profileManager.state);
    profileManager.cachePlan({ ...plan });
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
  if (!plan) return '—';
  if (plan.style === 'custom' && (plan.customMuscles || []).length) {
    const labels = (plan.customMuscles || []).map((id) => CUSTOM_LIBRARY[id]?.label || id);
    return `CUSTOM · ${plan.format?.toUpperCase() || 'FOCUS'} · ${labels.join(' · ')}`;
  }
  const focusList = (plan.goalFocus || []).slice(0, 2);
  const focus = focusList.length ? ` · ${focusList.join(' · ')}` : '';
  return `${(plan.style || '').toUpperCase()} · ${(plan.format || '').toUpperCase()}${focus}`;
}

/* -------------------------------------------------------------------------- */
/* Muscle selector UI component                                               */
/* -------------------------------------------------------------------------- */

class MuscleSelector {
  constructor(layout, limit = 3) {
    this.layout = layout;
    this.limit = limit;
    this.selected = new Set();
    this.container = null;
    this.chipContainer = null;
    this.statusNode = null;
    this.limitTimer = null;
    this.onChange = null;
    this.view = 'front';
    this.svg = null;
  }

  mount(container, statusNode, view = this.view) {
    if (!doc || !container) return;
    this.container = container;
    this.statusNode = statusNode || null;
    this.view = view || 'front';
    container.innerHTML = '';
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 420');
    svg.setAttribute('class', 'muscle-map');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Interactive muscle selector');

    this.layout.forEach((region) => {
      const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', region.path);
      path.dataset.muscle = region.id;
      path.dataset.side = region.side || 'front';
      path.setAttribute('class', 'muscle-region');
      path.setAttribute('tabindex', '0');
      path.setAttribute('role', 'switch');
      path.setAttribute('aria-label', region.label);
      path.setAttribute('aria-checked', 'false');
      path.addEventListener('click', () => this.toggle(region.id));
      path.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.toggle(region.id);
        }
      });
      svg.appendChild(path);
    });

    container.appendChild(svg);
    this.svg = svg;
    this.renderChipList();
    this.applyView();
    this.syncPaths();
    this.updateChips();
    this.updateStatus();
    this.syncAccessibility();
    this.emitChange();
  }

  toggle(id) {
    if (this.selected.has(id)) {
      this.selected.delete(id);
    } else if (this.selected.size < this.limit) {
      this.selected.add(id);
    } else {
      this.updateStatus();
      this.flashLimitNotice();
      return;
    }
    this.syncPaths();
    this.updateChips();
    this.updateStatus();
    this.syncAccessibility();
    this.emitChange();
  }

  renderChipList() {
    if (!this.container) return;
    this.chipContainer = doc.createElement('div');
    this.chipContainer.className = 'chip-container';
    this.container.appendChild(this.chipContainer);
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
        this.syncPaths();
        this.updateChips();
        this.updateStatus();
        this.emitChange();
      });
      this.chipContainer.appendChild(chip);
    });
  }

  syncPaths() {
    if (!this.container) return;
    this.container.querySelectorAll('.muscle-region').forEach((node) => {
      node.classList.toggle('active', this.selected.has(node.dataset.muscle));
    });
  }

  updateStatus() {
    if (!this.statusNode) return;
    const count = this.selected.size;
    const remainder = this.limit - count;
    const suffix = remainder <= 0 ? ' — limit reached' : '';
    this.statusNode.textContent = `${count} of ${this.limit} focus areas selected${suffix}`;
    if (count >= this.limit) this.statusNode.classList.add('limit');
    else this.statusNode.classList.remove('limit');
  }

  flashLimitNotice() {
    if (!this.statusNode) return;
    this.statusNode.classList.add('limit');
    clearTimeout(this.limitTimer);
    this.limitTimer = setTimeout(() => {
      if (this.selected.size < this.limit) {
        this.statusNode?.classList.remove('limit');
      }
    }, 600);
  }

  value() {
    return Array.from(this.selected).slice(0, this.limit);
  }

  setValue(muscles = []) {
    this.selected = new Set((muscles || []).slice(0, this.limit));
    this.syncPaths();
    this.updateChips();
    this.updateStatus();
    this.syncAccessibility();
    this.emitChange();
  }

  clear() {
    this.selected.clear();
    this.syncPaths();
    this.updateChips();
    this.updateStatus();
    this.syncAccessibility();
    this.emitChange();
  }

  setOnChange(handler) {
    this.onChange = handler;
  }

  emitChange() {
    if (typeof this.onChange === 'function') {
      this.onChange(this.value());
    }
  }

  applyView() {
    if (!this.container) return;
    this.container.querySelectorAll('.muscle-region').forEach((node) => {
      const side = node.dataset.side || 'front';
      const visible = side === this.view;
      node.classList.toggle('muscle-region--hidden', !visible);
      node.setAttribute('aria-hidden', String(!visible));
      node.tabIndex = visible ? 0 : -1;
    });
  }

  setView(view) {
    if (!view) return;
    this.view = view;
    this.applyView();
  }

  syncAccessibility() {
    if (!this.container) return;
    this.container.querySelectorAll('.muscle-region').forEach((node) => {
      const checked = this.selected.has(node.dataset.muscle);
      node.setAttribute('aria-checked', checked ? 'true' : 'false');
    });
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
    this.activeView = 'front';
    this.activeStep = 0;
    this.maxStepReached = 0;
  }

  init() {
    if (!doc) return;
    this.cacheDom();
    this.bindEvents();
    this.syncStyleButtons();
    this.syncCustomBuilder();
    this.activateStep(0);
    this.renderWelcome();
    this.renderPlanScreen();
    renderHistory(this.profile.logs);
    renderProgressChart(this.profile.logs);
    this.tickClock();
  }

  cacheDom() {
    this.welcomeScreen = $('#screen-welcome');
    this.startBtn = $('#btnStartExperience');
    this.nextStepBtns = $$('.btn-step');
    this.levelSelect = $('#levelSelect');
    this.styleButtons = $$('.style-option');
    this.goalSelect = $('#goalSelect');
    this.equipmentSelect = $('#equipmentSelect');
    this.customBuilderPanel = $('#customBuilderPanel');
    this.muscleContainer = $('#muscleSelector');
    this.muscleStatusCount = $('#muscleSelectionCount');
    this.clearMusclesBtn = $('#btnClearMuscles');
    this.planBlocks = $('#planBlocks');
    this.hiitList = $('#hiitList');
    this.goalFocusList = $('#goalFocusList');
    this.planFocus = $('#planFocus');
    this.planRotation = $('#planRotation');
    this.planDuration = $('#planDuration');
    this.motivationText = $('#motivationQuote');
    this.stepper = $('#flowStepper');
    this.stepperItems = this.stepper ? Array.from(this.stepper.querySelectorAll('[data-step]')) : [];
    this.stepSections = $$('.flow-section');
    this.viewToggleButtons = $$('.muscle-view-toggle button');
    this.comboGrid = $('#muscleComboGrid');
  }

  bindEvents() {
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        this.activateStep(1);
        this.syncCustomBuilder();
      });
    }

    this.nextStepBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = Number(btn.dataset.nextStep || '2');
        if (step === 2) {
          this.syncCustomBuilder();
        }
        if (step === 3) {
          this.updateStateFromSelectors();
          this.renderPlanScreen(true);
        }
        this.activateStep(step);
      });
    });

    if (this.stepperItems?.length) {
      this.stepperItems.forEach((item) => {
        item.addEventListener('click', () => {
          const step = Number(item.dataset.step);
          if (Number.isNaN(step)) return;
          if (step > this.maxStepReached + 1) return;
          if (step === this.activeStep) return;
          if (step === 2) {
            this.syncCustomBuilder();
          }
          if (step === 3) {
            this.updateStateFromSelectors();
            this.renderPlanScreen(true);
          }
          this.activateStep(step);
        });
      });
    }

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

    this.styleButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const style = btn.dataset.style;
        this.profile.updateSelection({ style });
        if (style !== 'custom') {
          this.lastGuidedStyle = style;
        }
        this.syncStyleButtons();
        this.syncCustomBuilder();
        this.updateEquipmentOptions();
        this.renderPlanScreen(true);
      });
    });

    if (this.viewToggleButtons?.length) {
      this.viewToggleButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          if (this.profile.state.style !== 'custom') return;
          const view = btn.dataset.view || 'front';
          if (view === this.activeView) return;
          this.activeView = view;
          this.syncViewToggle();
          this.muscleSelector.setView(view);
        });
      });
    }

    if (this.clearMusclesBtn) {
      this.clearMusclesBtn.addEventListener('click', () => {
        this.muscleSelector.clear();
        this.syncCustomBuilder();
      });
    }

    $('#btnMarkDone')?.addEventListener('click', () => this.submitFeedback());
    $('#btnBackHome')?.addEventListener('click', () => this.activateStep(0));
    $('#linkChangeStyle')?.addEventListener('click', () => this.activateStep(1));
  }

  syncStyleButtons() {
    if (!this.styleButtons) return;
    this.styleButtons.forEach((btn) => {
      const isActive = btn.dataset.style === this.profile.state.style;
      btn.classList.toggle('style-option--active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  syncViewToggle() {
    if (!this.viewToggleButtons?.length) return;
    const disabled = this.profile.state.style !== 'custom';
    this.viewToggleButtons.forEach((btn) => {
      const view = btn.dataset.view || 'front';
      const isActive = view === this.activeView && !disabled;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      btn.disabled = disabled;
    });
  }

  renderCombos() {
    if (!this.comboGrid) return;
    this.comboGrid.innerHTML = '';
    MUSCLE_COMBOS.forEach((combo) => {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'combo-card';
      button.dataset.combo = combo.id;
      button.dataset.muscles = combo.muscles.slice().sort().join(',');
      const labels = combo.muscles.map((id) => CUSTOM_LIBRARY[id]?.label || id);
      button.innerHTML = `
        <span class="combo-card__title">${combo.label}</span>
        <span class="combo-card__meta">${labels.join(' · ')}</span>
      `;
      button.addEventListener('click', () => {
        this.muscleSelector.setValue(combo.muscles);
      });
      this.comboGrid.appendChild(button);
    });
  }

  syncComboState(muscles = []) {
    if (!this.comboGrid) return;
    const key = muscles.slice().sort().join(',');
    this.comboGrid.querySelectorAll('.combo-card').forEach((card) => {
      const cardKey = (card.dataset.muscles || '').split(',').filter(Boolean).sort().join(',');
      card.classList.toggle('is-active', cardKey === key && key.length > 0);
    });
  }

  syncCustomBuilder() {
    if (!this.muscleContainer) return;
    const isCustom = this.profile.state.style === 'custom';
    this.customBuilderPanel?.classList.toggle('hidden', !isCustom);
    if (isCustom) {
      this.muscleSelector.mount(this.muscleContainer, this.muscleStatusCount, this.activeView);
      const stored = this.profile.state.customMuscles || [];
      this.muscleSelector.setValue(stored);
      this.muscleSelector.setOnChange((muscles) => {
        this.profile.updateSelection({ customMuscles: muscles });
        this.syncComboState(muscles);
        this.renderPlanScreen(true);
      });
      this.muscleSelector.setView(this.activeView);
      this.syncViewToggle();
      this.renderCombos();
      this.syncComboState(stored);
      this.muscleSelector.emitChange();
    } else {
      this.muscleSelector.setOnChange(null);
      this.syncViewToggle();
    }
  }

  updateStateFromSelectors() {
    const muscles = this.profile.state.style === 'custom' ? this.muscleSelector.value() : [];
    this.profile.updateSelection({ customMuscles: muscles });
  }

  activateStep(step) {
    if (!doc) return;
    this.activeStep = step;
    this.maxStepReached = Math.max(this.maxStepReached, step);
    if (this.stepperItems) {
      this.stepperItems.forEach((node) => {
        const nodeStep = Number(node.dataset.step);
        const isActive = nodeStep === step;
        const isCompleted = nodeStep < this.maxStepReached;
        const isEnabled = nodeStep <= this.maxStepReached + 1;
        node.classList.toggle('active', isActive);
        node.classList.toggle('completed', isCompleted && !isActive);
        node.setAttribute('aria-current', isActive ? 'step' : 'false');
        node.setAttribute('aria-disabled', isEnabled ? 'false' : 'true');
        node.tabIndex = isEnabled ? 0 : -1;
      });
    }

    if (this.stepSections) {
      this.stepSections.forEach((section) => {
        const sectionStep = Number(section.dataset.stepSection);
        const isActive = sectionStep === step;
        section.classList.toggle('hidden', !isActive);
        section.setAttribute('aria-hidden', String(!isActive));
      });
      const current = this.stepSections.find((section) => Number(section.dataset.stepSection) === step);
      if (current) {
        if (typeof current.scrollIntoView === 'function') {
          current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setTimeout(() => {
          if (typeof current.focus === 'function') {
            current.focus();
          }
        }, 200);
      }
    }
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
      this.profile.cachePlan({ ...this.currentPlan });
    }
    this.drawPlan(this.currentPlan);
    if (force) {
      this.renderWelcome();
    }
    if (this.profile.state.style === 'custom') {
      this.syncComboState(this.profile.state.customMuscles || []);
    }
  }

  drawPlan(plan) {
    if (!doc) return;
    this.planBlocks.innerHTML = '';
    this.planFocus.textContent = formatPlanSummary(plan);
    const baseMode = plan.mode || 'focus';
    const rotationLabel = plan.mode === 'muscle-selection'
      ? 'Custom muscle rotation'
      : `${baseMode.charAt(0).toUpperCase() + baseMode.slice(1)} rotation`;
    this.planRotation.textContent = rotationLabel;
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
