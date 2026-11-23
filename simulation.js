import { replayDataSource, shelters } from './src/adapters/dataSource.js';
import { createWorkflow } from './src/agents/orchestrator.js';
import { assessReading } from './src/agents/riskAssessor.js';
import { createInitialState } from './src/core/store.js';

export { areas, timeline } from './src/adapters/dataSource.js';
export { classifyReply } from './src/agents/rescueTriage.js';
export { REALERT_RISE } from './src/agents/riskAssessor.js';
export { shelterSpace } from './src/agents/shelterRouter.js';

export function assess(index, tick) {
  return assessReading(replayDataSource.read(tick)[index]);
}

export function initialState() {
  const workflow = createWorkflow(createInitialState(shelters));
  workflow.start();
  return workflow.getState();
}

// Keep the existing command API while applying pure updates to the store first.
function transact(state, command, ...args) {
  const workflow = createWorkflow(state);
  if (!workflow[command](...args)) return false;
  Object.assign(state, workflow.getState());
  return true;
}

export function advance(state) {
  return transact(state, 'advance');
}

export function decideAlert(state, areaId, approved) {
  return transact(state, 'decideAlert', areaId, approved);
}

export function toggleShelter(state, shelterId) {
  return transact(state, 'toggleShelter', shelterId);
}

export function receiveReply(state, recipientId, text) {
  return transact(state, 'receiveReply', recipientId, text);
}

export function resolveCase(state, caseId) {
  return transact(state, 'resolveCase', caseId);
}
