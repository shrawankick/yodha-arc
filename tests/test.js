/*
  Minimal assertions for the adaptive Yodha Arc planner.

  Run with: `node tests/test.js`
*/

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const { generateWorkoutPlan, HIIT_LIBRARY, CALISTHENICS_MOVES } = require('../app');

function getPlan(dayOffset = 0, overrides = {}) {
  const date = new Date('2025-01-01T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return generateWorkoutPlan(date, overrides);
}

function testDurations() {
  for (let i = 0; i < 14; i += 1) {
    const plan = getPlan(i, { style: 'gym', level: 'Intermediate', goal: 'strength', equipment: 'freeweight' });
    assert(plan.estimatedMinutes <= 70, `Gym plan day ${i} exceeds 70 minutes`);
    assert(plan.hiit.length === 7, 'HIIT finisher must be 7 moves');
  }
}

function testLevelScaling() {
  const beginner = getPlan(0, { style: 'gym', level: 'Beginner' });
  const advanced = getPlan(0, { style: 'gym', level: 'Advanced' });
  const beginnerSets = beginner.blocks.flatMap((b) => b.exercises).reduce((acc, ex) => acc + (ex.sets || 0), 0);
  const advancedSets = advanced.blocks.flatMap((b) => b.exercises).reduce((acc, ex) => acc + (ex.sets || 0), 0);
  assert(advancedSets > beginnerSets, 'Advanced should have more total sets than Beginner');
}

function testRotationVaries() {
  const day0 = getPlan(0, { style: 'gym' });
  const day1 = getPlan(1, { style: 'gym' });
  const day3 = getPlan(3, { style: 'gym' });
  assert(day0.format !== day1.format || day0.mode !== day1.mode, 'Consecutive gym days should rotate');
  assert(day0.mode !== day3.mode, 'Phase should shift across rotation');
}

function testCalisthenicsEverywhere() {
  const styles = [
    { style: 'gym', equipment: 'calisthenics' },
    { style: 'home', equipment: 'calisthenics' },
    { style: 'outdoor', equipment: 'calisthenics' },
  ];
  styles.forEach(({ style, equipment }) => {
    const plan = getPlan(2, { style, equipment });
    const calisthenicsBlock = plan.blocks.find((block) => block.type === 'calisthenics');
    assert(calisthenicsBlock, `${style} should include a calisthenics block`);
    assert(calisthenicsBlock.exercises.length > 0, 'Calisthenics block should have movements');
  });
}

function testHiitLibrary() {
  assert(Array.isArray(HIIT_LIBRARY) && HIIT_LIBRARY.length >= 3, 'HIIT library needs variety');
  HIIT_LIBRARY.forEach((sequence) => {
    assert(sequence.length === 7, 'Every HIIT sequence must have 7 movements');
  });
}

function testCalisthenicsCatalog() {
  assert(CALISTHENICS_MOVES.length >= 6, 'Calisthenics catalog should provide depth');
}

function run() {
  testDurations();
  testLevelScaling();
  testRotationVaries();
  testCalisthenicsEverywhere();
  testHiitLibrary();
  testCalisthenicsCatalog();
  console.log('All tests passed.');
}

run();
