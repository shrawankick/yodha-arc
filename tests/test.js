/*
  Minimal test harness for the Yodha Arc generator

  This script can be executed with ``node tests/test.js``. It imports the
  ``generateDailyPlan`` function from the parent directory and runs a
  handful of assertions to verify that core logic behaves as expected.

  Since third‑party testing libraries are unavailable in this environment
  (e.g. Jest or Mocha), a simple homemade assert function is used. When
  tests pass, the script outputs a success message; otherwise it throws an
  error detailing the failure.
*/

const { generateDailyPlan, FINISHERS } = require('../app');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTests() {
  // Test each day for beginner
  const dayKeys = ['FoundationA', 'FoundationB', 'FoundationC', 'DetailA', 'DetailB', 'DetailC'];
  dayKeys.forEach((key) => {
    const plan = generateDailyPlan(key, 'Beginner');
    assert(plan.accessories.length === 4, `${key} beginner should have 4 accessories`);
    assert(plan.compound.sets === 3, `${key} beginner compound should have 3 sets`);
  });
  // Test each day for intermediate
  dayKeys.forEach((key) => {
    const plan = generateDailyPlan(key, 'Intermediate');
    assert(plan.accessories.length === 5, `${key} intermediate should have 5 accessories`);
    assert(plan.compound.sets === 4, `${key} intermediate compound should have 4 sets`);
  });
  // Unknown day key should throw
  let errorThrown = false;
  try {
    generateDailyPlan('UnknownDay', 'Beginner');
  } catch (err) {
    errorThrown = true;
  }
  assert(errorThrown, 'Unknown day should throw an error');

  // Seeded plan determinism
  const seed1 = 12345;
  const seed2 = 54321;
  const plan1a = generateDailyPlan('FoundationA', 'Beginner', seed1);
  const plan1b = generateDailyPlan('FoundationA', 'Beginner', seed1);
  const plan2 = generateDailyPlan('FoundationA', 'Beginner', seed2);
  assert(JSON.stringify(plan1a) === JSON.stringify(plan1b), 'Identical seeds should yield identical plans');
  assert(JSON.stringify(plan1a) !== JSON.stringify(plan2), 'Different seeds should yield different plans');

  // Finisher order
  const defaultMoves = FINISHERS.default.map((m) => m.name);
  assert(defaultMoves[0] === 'Jumping Jacks', 'First default finisher move should be Jumping Jacks');
  console.log('All tests passed.');
}

runTests();