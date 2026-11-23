import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  advance, assess, classifyReply, decideAlert, initialState, receiveReply, resolveCase, shelterSpace, toggleShelter,
} from './simulation.js';

function approvedReplay() {
  const state = initialState();
  advance(state);
  decideAlert(state, 'sylhet', true);
  return state;
}

test('severe readings create one pending alert and hold delivery until approval', () => {
  const state = initialState();
  assert.equal(assess(0, state.tick).severity, 'Watch');
  assert.equal(decideAlert(state, 'sylhet', true), false);
  advance(state);
  assert.equal(assess(0, state.tick).severity, 'Severe');
  assert.deepEqual(state.alerts.map(({ area, status }) => [area, status]), [['sylhet', 'pending']]);
  assert.equal(state.outbox.length, 0);
  assert.equal(decideAlert(state, 'sylhet', true), true);
  assert.equal(decideAlert(state, 'sylhet', true), false);
  assert.deepEqual(new Set(state.outbox.map(message => message.channel)), new Set(['Voice call', 'SMS', 'WhatsApp']));
  for (const message of state.outbox) {
    assert.match(message.text, /^বন্যা মহড়া: সিলেট/);
    assert.ok(message.text.endsWith(message.channel === 'Voice call' ? '২ চাপুন।' : '২ লিখে পাঠান।'));
  }
  advance(state);
  assert.equal(state.alerts.filter(alert => alert.area === 'sylhet').length, 1);
  assert.equal(state.alerts.find(alert => alert.area === 'chattogram').status, 'pending');
});

test('rejection leaves households and outbound messages untouched', () => {
  const state = initialState();
  advance(state);
  decideAlert(state, 'sylhet', false);
  advance(state);
  assert.equal(state.alerts[0].status, 'rejected');
  assert.deepEqual(state.recipients, []);
  assert.deepEqual(state.outbox, []);
});

test('full shelters reroute reservations without exceeding alternate capacity', () => {
  const state = approvedReplay();
  const [first, second] = state.shelters;
  assert.equal(shelterSpace(state, first), 6);
  toggleShelter(state, first.id);
  assert.ok(state.recipients.every(recipient => recipient.shelter === second.id));
  assert.equal(shelterSpace(state, second), 20);
  const reroutes = state.outbox.filter(message => message.kind === 'Reroute');
  assert.equal(reroutes.length, 3);
  assert.ok(reroutes.every(message => message.text.startsWith('বন্যা মহড়া:')));
  toggleShelter(state, second.id);
  assert.ok(state.recipients.every(recipient => recipient.shelter === null));
  toggleShelter(state, first.id);
  assert.ok(state.recipients.every(recipient => recipient.shelter === first.id));
});

test('Bangla replies create reviewable cases and retain reported group size', () => {
  const state = approvedReplay();
  assert.deepEqual(classifyReply('আমরা আটকে আছি, ৫ জন'), { category: 'Rescue', people: 5 });
  assert.equal(classifyReply('নিরাপদ নই').category, 'Help needed');
  assert.equal(classifyReply('১').category, 'Safe');
  assert.equal(classifyReply('২।').category, 'Help needed');
  assert.equal(classifyReply('অজানা উত্তর').category, 'Needs review');
  assert.equal(receiveReply(state, 'jamal', '   '), false);
  receiveReply(state, 'jamal', 'আমরা আটকে আছি, ৫ জন');
  receiveReply(state, 'jamal', 'নৌকা দরকার, ৬ জন');
  assert.equal(state.cases.length, 1);
  assert.equal(state.cases[0].people, 6);
  assert.equal(resolveCase(state, state.cases[0].id), true);
  assert.equal(state.cases[0].resolved, true);
});

test('only households without a reply receive one simulated voice follow-up', () => {
  const state = approvedReplay();
  receiveReply(state, 'rahima', '১');
  receiveReply(state, 'jamal', 'সাহায্য দরকার');
  advance(state);
  advance(state);
  const followUps = state.outbox.filter(message => message.kind === 'Follow-up');
  assert.deepEqual(followUps.map(({ recipient, channel }) => [recipient, channel]), [['Salma', 'Voice call']]);
  assert.equal(advance(state), false);
});
