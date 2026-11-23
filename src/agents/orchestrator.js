import { areas, households, replayDataSource, shelters, timeline } from '../adapters/dataSource.js';
import { previewDelivery } from '../adapters/delivery.js';
import { activity, createEventBus } from '../core/events.js';
import { createStore } from '../core/store.js';
import { registerBanglaCommunicator } from './banglaCommunicator.js';
import { registerMonitor } from './monitor.js';
import { registerRescueTriage } from './rescueTriage.js';
import { registerRiskAssessor } from './riskAssessor.js';
import { registerShelterRouter } from './shelterRouter.js';

export function createWorkflow(initialState, { dataSource = replayDataSource, delivery = previewDelivery } = {}) {
  const { getState, dispatch } = createStore(initialState);
  const bus = createEventBus(dispatch);
  const { publish } = bus;
  registerMonitor(bus, dataSource);
  registerRiskAssessor(bus, getState);
  registerBanglaCommunicator(bus, getState, areas, delivery);
  registerShelterRouter(bus, getState, households, shelters);
  registerRescueTriage(bus, getState, timeline);

  bus.subscribe('VerifyResponses', () => {
    const { tick, recipients } = getState();
    for (const recipient of recipients) {
      if (recipient.status !== 'Awaiting reply' || recipient.sentAt >= tick) continue;
      const params = { householdId: recipient.id };
      if (!recipient.followedUp) {
        publish({
          type: 'FollowUpRequested',
          recipient,
          activity: activity('Orchestrator', 'activity.followUpQueued', params,
            `Queued a simulated Bangla voice follow-up for ${recipient.name} after no reply.`),
        });
      } else if (recipient.followedUpAt < tick) {
        publish({
          type: 'Escalated',
          recipientId: recipient.id,
          activity: activity('Orchestrator', 'activity.escalated', params,
            `${recipient.name} is still silent after the follow-up. Escalated to the ward volunteer.`),
        });
      }
    }
  });

  return {
    getState,
    start() {
      publish({ type: 'ReplayStarted', tick: getState().tick });
    },
    advance() {
      const { tick } = getState();
      if (tick >= timeline.length - 1) return false;
      publish({ type: 'ReplayAdvanced', tick: tick + 1 });
      publish({ type: 'VerifyResponses' });
      return true;
    },
    decideAlert(areaId, approved) {
      const alert = getState().alerts.find(item => item.area === areaId && item.status === 'pending');
      if (!alert) return false;
      const area = areas.find(item => item.id === areaId);
      publish({
        type: approved ? 'AlertApproved' : 'AlertRejected',
        areaId,
        activity: activity('Officer', approved ? 'activity.alertApproved' : 'activity.alertRejected',
          { areaId }, `${approved ? 'Approved' : 'Rejected'} the severe ${area.name} alert.`),
      });
      return true;
    },
    toggleShelter(shelterId) {
      if (!getState().shelters.some(item => item.id === shelterId)) return false;
      publish({ type: 'ShelterToggleRequested', shelterId });
      return true;
    },
    receiveReply(recipientId, text) {
      const message = text.trim();
      if (!message || message.length > 280 || !getState().recipients.some(item => item.id === recipientId)) return false;
      publish({ type: 'ReplyReceived', recipientId, message });
      return true;
    },
    resolveCase(caseId) {
      const incident = getState().cases.find(item => item.id === caseId && !item.resolved);
      if (!incident) return false;
      publish({
        type: 'CaseResolved',
        caseId,
        activity: activity('Officer', 'activity.caseClosed', { householdId: incident.recipientId },
          `Closed ${incident.name}'s simulated case.`),
      });
      return true;
    },
  };
}
