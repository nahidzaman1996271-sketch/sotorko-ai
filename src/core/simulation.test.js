import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  advance, assess, classifyReply, decideAlert, initialState, receiveReply, resolveCase, shelterSpace, toggleShelter,
} from '../../simulation.js';

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

test('everyday safe replies, negations and number words are understood', () => {
  for (const text of ['আমি নিরাপদ', 'আমরা নিরাপদে আছি', 'ঠিক আছি', 'ভালো আছি', '১, আমরা নিরাপদ', 'ok', 'we are safe', 'not stuck, safe', 'আমরা আটকে নেই, নিরাপদ']) {
    assert.equal(classifyReply(text).category, 'Safe', text);
  }
  for (const text of ['নিরাপদ নই', 'নিরাপদে নেই', 'নিরাপদ নয়', 'I am not safe', 'help me', '২']) {
    assert.equal(classifyReply(text).category, 'Help needed', text);
  }
  for (const text of ['আমরা নিরাপদ, সাহায্য দরকার নেই', 'safe, no need for help', 'ঠিক আছি, সাহায্য লাগবে না']) {
    assert.equal(classifyReply(text).category, 'Safe', text);
  }
  for (const text of ['নিরাপদ আশ্রয় দরকার', 'we need a safe place', 'খাবার প্রয়োজন']) {
    assert.equal(classifyReply(text).category, 'Help needed', text);
  }
  assert.equal(classifyReply('helpless').category, 'Needs review');
  assert.deepEqual(classifyReply('পাঁচ জন আটকে আছি'), { category: 'Rescue', people: 5 });
  assert.deepEqual(classifyReply('we are three people on the roof'), { category: 'Rescue', people: 3 });
  assert.deepEqual(classifyReply('দুই জন আহত'), { category: 'Medical', people: 2 });
  assert.equal(classifyReply('আমরা আটকে আছি').people, null);
});

test('a safe reply closes the household’s open case', () => {
  const state = approvedReplay();
  receiveReply(state, 'jamal', 'সাহায্য দরকার');
  assert.equal(state.cases.filter(incident => !incident.resolved).length, 1);
  receiveReply(state, 'jamal', '১');
  const [incident] = state.cases;
  assert.equal(incident.resolved, true);
  assert.match(incident.resolution, /Reported safe/);
  assert.equal(state.recipients.find(recipient => recipient.id === 'jamal').status, 'Safe');
});

test('households still silent after the follow-up are escalated once', () => {
  const state = approvedReplay();
  receiveReply(state, 'rahima', '১');
  receiveReply(state, 'jamal', '১');
  advance(state);
  assert.equal(state.cases.length, 0);
  advance(state);
  const escalated = state.cases.filter(incident => incident.category === 'No response');
  assert.deepEqual(escalated.map(({ name, people }) => [name, people]), [['Salma', 3]]);
  assert.equal(state.recipients.find(recipient => recipient.id === 'salma').status, 'No response');
  receiveReply(state, 'salma', 'আমরা নিরাপদ');
  assert.equal(state.cases[0].resolved, true);
});

test('a rejected alert is re-raised once the river keeps rising', () => {
  const state = initialState();
  advance(state);
  decideAlert(state, 'sylhet', false);
  advance(state);
  const sylhet = state.alerts.filter(alert => alert.area === 'sylhet');
  assert.deepEqual(sylhet.map(({ status, reraised }) => [status, reraised]), [['rejected', false], ['pending', true]]);
  advance(state);
  assert.equal(state.alerts.filter(alert => alert.area === 'sylhet').length, 2);
  assert.equal(decideAlert(state, 'sylhet', true), true);
  assert.equal(state.recipients.filter(recipient => recipient.area === 'sylhet').length, 3);
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
