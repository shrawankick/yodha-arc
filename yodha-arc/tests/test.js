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

const { generateDailyPlan } = require('../app');

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
  console.log('All tests passed.');
}

runTests();