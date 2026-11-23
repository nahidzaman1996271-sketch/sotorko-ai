import assert from 'node:assert/strict';
import test from 'node:test';
import { advance, decideAlert, initialState, receiveReply, toggleShelter } from '../../simulation.js';
import { guideStep } from './guidedDemo.js';
import { householdMessages, phoneReply } from './citizenPhone.js';

test('the six guided steps follow the same officer and citizen actions as the regular replay', () => {
  const state = initialState();
  assert.equal(guideStep(state).step, 1);
  advance(state);
  assert.equal(guideStep(state).step, 2);
  assert.equal(state.outbox.length, 0);
  decideAlert(state, 'sylhet', true);
  assert.equal(guideStep(state).step, 3);
  assert.ok(householdMessages(state, state.recipients.find(item => item.id === 'rahima')).voice);
  assert.ok(householdMessages(state, state.recipients.find(item => item.id === 'jamal')).alert);
  toggleShelter(state, 'school-a');
  assert.equal(guideStep(state).household, 'rahima');
  assert.equal(householdMessages(state, state.recipients.find(item => item.id === 'rahima')).alert.kind, 'Reroute');
  receiveReply(state, 'rahima', phoneReply('safe'));
  assert.equal(guideStep(state).household, 'jamal');
  receiveReply(state, 'jamal', phoneReply('rescue'));
  assert.equal(guideStep(state).step, 5);
  advance(state);
  assert.equal(guideStep(state).step, 6);
  advance(state);
  assert.equal(guideStep(state).step, 7);
  assert.ok(state.cases.some(item => item.name === 'Salma' && item.category === 'No response'));
});

test('the guide can recognise a run that needs a restart', () => {
  const state = initialState();
  advance(state);
  decideAlert(state, 'sylhet', false);
  assert.equal(guideStep(state).restart, true);
  assert.equal(phoneReply('help'), '২');
  assert.equal(phoneReply('constructor'), null);
});

test('the guide recognises an alternate shelter already assigned at approval', () => {
  const state = initialState();
  advance(state);
  toggleShelter(state, 'school-a');
  decideAlert(state, 'sylhet', true);
  assert.equal(guideStep(state).step, 4);
});
