import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advance, decideAlert, initialState, receiveReply, resolveCase } from '../../simulation.js';
import { shiftHandover } from './handover.js';

test('handover follows district approvals, replies, escalation and case closure', () => {
  const state = initialState();
  const district = () => shiftHandover(state, 'en').districts[0];
  assert.equal(district().action, 'river-panel');
  advance(state);
  assert.equal(district().action, 'alerts');
  decideAlert(state, 'sylhet', true);
  assert.equal(district().action, 'replies');
  receiveReply(state, 'rahima', '১');
  receiveReply(state, 'jamal', 'stuck');
  advance(state);
  advance(state);
  assert.deepEqual(district().counts, { alerted: 3, safe: 1, awaiting: 0, open: 2 });
  assert.equal(district().action, 'triage');
  for (const item of state.cases) resolveCase(state, item.id);
  assert.equal(district().counts.safe, 1);
  assert.equal(district().counts.open, 0);
  assert.equal(shiftHandover(state, 'en').districts[1].counts.alerted, 0);
});

test('Bangla plain-text handover includes the drill label, replay time and each district', () => {
  const brief = shiftHandover(initialState(), 'bn');
  assert.match(brief.report, /মহড়া/);
  assert.match(brief.report, /০৮:০০/);
  for (const district of brief.districts) {
    assert.ok(brief.report.includes(district.name));
    assert.ok(brief.report.includes(district.next));
  }
});
