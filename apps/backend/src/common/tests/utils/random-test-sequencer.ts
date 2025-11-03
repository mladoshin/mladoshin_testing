// random-test-sequencer.ts
const Sequencer = require('@jest/test-sequencer').default;

class RandomSequencer extends Sequencer {
  sort(tests) {
    return tests.sort(() => Math.random() - 0.5);
  }
}

module.exports = RandomSequencer;
