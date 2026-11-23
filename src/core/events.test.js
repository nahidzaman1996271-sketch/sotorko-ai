import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEventBus } from './events.js';

test('the bus reduces each event once before notifying subscribers and drains nested events in order', () => {
  const order = [];
  const bus = createEventBus(event => order.push(`reduce ${event.type}`));
  bus.subscribe('ReadingReceived', () => {
    order.push('assess reading');
    bus.publish({ type: 'RiskAssessed' });
  });
  bus.subscribe('ReadingReceived', () => order.push('record reading'));
  bus.subscribe('RiskAssessed', () => {
    order.push('evaluate alert');
    bus.publish({ type: 'AlertRaised' });
  });
  const unsubscribe = bus.subscribe('AlertRaised', () => order.push('unsubscribed listener'));
  unsubscribe();
  bus.publish({ type: 'ReadingReceived' });
  assert.deepEqual(order, [
    'reduce ReadingReceived', 'assess reading', 'record reading',
    'reduce RiskAssessed', 'evaluate alert', 'reduce AlertRaised',
  ]);
});

test('the bus discards queued events after a listener throws', () => {
  const handled = [];
  const bus = createEventBus(event => handled.push(event.type));
  bus.subscribe('Broken', () => {
    bus.publish({ type: 'Discarded' });
    throw new Error('Failed listener');
  });
  assert.throws(() => bus.publish({ type: 'Broken' }), /Failed listener/);
  bus.publish({ type: 'Ready' });
  assert.deepEqual(handled, ['Broken', 'Ready']);
});
