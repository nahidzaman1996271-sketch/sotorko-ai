import assert from 'node:assert/strict';
import { test } from 'node:test';
import { areas, replayDataSource, shelters } from '../adapters/dataSource.js';
import { createEventBus } from '../core/events.js';
import { createInitialState } from '../core/store.js';
import { composeMessage } from './banglaCommunicator.js';
import { registerMonitor } from './monitor.js';
import { createWorkflow } from './orchestrator.js';
import { registerRiskAssessor } from './riskAssessor.js';

test('Monitor uses the injected reading adapter and records its reason', () => {
  const records = [];
  const bus = createEventBus();
  const reading = { area: areas[0], level: 4.71, rain: 76, previousLevel: 4.71 };
  registerMonitor(bus, { read(tick) {
    assert.equal(tick, 2);
    return [reading];
  } });
  bus.subscribe('ReadingReceived', event => records.push(event));
  bus.publish({ type: 'ReplayAdvanced', tick: 2 });
  assert.equal(records.length, 1);
  assert.deepEqual(records[0].readings, [reading]);
  assert.equal(records[0].activity.messageKey, 'activity.monitor');
});

test('Risk Assessor reports every area and raises only severe readings', () => {
  const assessed = [];
  const alerts = [];
  const bus = createEventBus();
  const state = createInitialState(shelters);
  registerRiskAssessor(bus, () => state);
  bus.subscribe('RiskAssessed', event => assessed.push(event));
  bus.subscribe('AlertRaised', event => alerts.push(event.alert));
  bus.publish({ type: 'ReadingReceived', readings: replayDataSource.read(1) });
  assert.deepEqual(assessed.map(event => event.risk.severity), ['Severe', 'Normal', 'Normal']);
  assert.ok(assessed.every(event => event.activity.messageKey === 'activity.riskAssessed'));
  assert.deepEqual(alerts.map(alert => alert.area), ['sylhet']);
});

test('Shelter Router accounts for each reservation and retains the safe household’s place', () => {
  const initial = createInitialState(shelters);
  initial.shelters[0].occupancy = 43;
  const workflow = createWorkflow(initial);
  workflow.advance();
  workflow.decideAlert('sylhet', true);
  assert.deepEqual(workflow.getState().recipients.map(({ id, shelter }) => [id, shelter]), [
    ['rahima', 'school-a'], ['jamal', 'school-b'], ['salma', 'school-a'],
  ]);
  workflow.receiveReply('rahima', '১');
  workflow.toggleShelter('school-a');
  assert.deepEqual(workflow.getState().recipients.map(({ id, shelter }) => [id, shelter]), [
    ['rahima', 'school-a'], ['jamal', 'school-b'], ['salma', 'school-b'],
  ]);
  assert.deepEqual(initial.recipients, []);
  assert.equal(initial.shelters[0].occupancy, 43);
});

test('Bangla Communicator preserves simulation labels and sends channel-specific previews', () => {
  const voice = composeMessage(areas[0], shelters[0], 'Initial alert', 'Voice call');
  const reroute = composeMessage(areas[0], shelters[1], 'Reroute', 'SMS');
  assert.match(voice, /^বন্যা মহড়া: সিলেট/);
  assert.match(voice, /২ চাপুন।$/);
  assert.match(reroute, /^বন্যা মহড়া: আপনার আশ্রয়কেন্দ্র পরিবর্তন হয়েছে।/);
  assert.match(reroute, /২ লিখে পাঠান।$/);

  const queued = [];
  const workflow = createWorkflow(createInitialState(shelters), {
    delivery: { queue(message) { queued.push(message); return message; } },
  });
  workflow.advance();
  assert.equal(queued.length, 0);
  workflow.decideAlert('sylhet', true);
  assert.deepEqual(queued.map(message => message.recipientId), ['rahima', 'jamal', 'salma']);
});

test('Rescue Triage replaces a simulated escalation note with a household reply and records closure', () => {
  const workflow = createWorkflow(createInitialState(shelters));
  workflow.advance();
  workflow.decideAlert('sylhet', true);
  workflow.advance();
  workflow.advance();
  const escalation = workflow.getState().cases.find(incident => incident.recipientId === 'salma');
  assert.equal(escalation.textKey, 'case.noResponse');

  workflow.receiveReply('salma', 'পাঁচ জন আটকে আছি');
  const rescue = workflow.getState().cases.find(incident => incident.recipientId === 'salma');
  assert.equal(rescue.id, escalation.id);
  assert.equal(rescue.textKey, undefined);
  assert.equal(rescue.people, 5);
  workflow.receiveReply('salma', 'আমরা নিরাপদ');
  const closed = workflow.getState().cases.find(incident => incident.recipientId === 'salma');
  assert.equal(closed.resolved, true);
  assert.equal(closed.resolutionKey, 'case.reportedSafe');
  assert.deepEqual(closed.resolutionParams, { time: '08:45' });
});

test('Orchestrator gives the same state on every replay and prevents duplicate approvals and follow-ups', () => {
  function replay() {
    const workflow = createWorkflow(createInitialState(shelters));
    workflow.start();
    workflow.advance();
    assert.equal(workflow.decideAlert('sylhet', true), true);
    assert.equal(workflow.decideAlert('sylhet', true), false);
    workflow.advance();
    workflow.advance();
    assert.equal(workflow.advance(), false);
    return workflow.getState();
  }
  const first = replay();
  assert.deepEqual(replay(), first);
  assert.equal(first.outbox.filter(message => message.kind === 'Follow-up').length, 3);
  assert.equal(first.cases.filter(incident => incident.category === 'No response').length, 3);
  assert.equal(first.activity.filter(item => item.messageKey === 'activity.escalated').length, 3);
});
