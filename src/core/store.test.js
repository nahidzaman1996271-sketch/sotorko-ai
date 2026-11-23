import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitialState, reduceEvent } from './store.js';

test('recording an event returns an independent snapshot and timestamps its activity', () => {
  const initial = createInitialState([]);
  const next = reduceEvent(initial, {
    type: 'ReplayAdvanced',
    tick: 1,
    activity: { agent: 'Monitor', message: 'Next reading.' },
  });
  assert.equal(initial.tick, 0);
  assert.deepEqual(initial.activity, []);
  assert.equal(next.tick, 1);
  assert.deepEqual(next.activity, [{ tick: 1, agent: 'Monitor', message: 'Next reading.' }]);
});

test('resolving a case leaves previous case records intact', () => {
  const initial = { ...createInitialState([]), cases: [{ id: 3, category: 'Rescue' }] };
  const next = reduceEvent(initial, { type: 'CaseResolved', caseId: 3, resolution: { resolution: 'Safe' } });
  assert.deepEqual(initial.cases, [{ id: 3, category: 'Rescue' }]);
  assert.deepEqual(next.cases, [{ id: 3, category: 'Rescue', resolved: true, resolution: 'Safe' }]);
});
