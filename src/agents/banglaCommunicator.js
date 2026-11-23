import { activity } from '../core/events.js';

export function composeMessage(area, shelter, kind, channel) {
  const intro = kind === 'Reroute' ? 'বন্যা মহড়া: আপনার আশ্রয়কেন্দ্র পরিবর্তন হয়েছে।'
    : kind === 'Follow-up' ? 'বন্যা মহড়া: আপনার অবস্থা জানান।'
    : `বন্যা মহড়া: ${area.bn} এলাকায় বন্যার ঝুঁকি বেড়েছে।`;
  const destination = shelter ? `মহড়ায় আপনার জন্য নির্ধারিত আশ্রয়কেন্দ্র: ${shelter.bn}।` : 'মহড়ায় কোনো আশ্রয়কেন্দ্রে খালি জায়গা নেই।';
  const instruction = channel === 'Voice call' ? 'চাপুন' : 'লিখে পাঠান';
  return `${intro} ${destination} নিরাপদ থাকলে ১, সাহায্য প্রয়োজন হলে ২ ${instruction}।`;
}

export function registerBanglaCommunicator(bus, getState, areas, delivery) {
  function queue(recipient, kind, channel = recipient.channel) {
    const area = areas.find(item => item.id === recipient.area);
    const shelter = getState().shelters.find(item => item.id === recipient.shelter);
    const message = delivery.queue({
      recipientId: recipient.id,
      recipient: recipient.name,
      channel,
      kind,
      text: composeMessage(area, shelter, kind, channel),
    });
    bus.publish({ type: 'MessageQueued', message });
  }

  bus.subscribe('ShelterAssigned', ({ recipient, kind }) => queue(recipient, kind));
  bus.subscribe('FollowUpRequested', ({ recipient }) => queue(recipient, 'Follow-up', 'Voice call'));
  bus.subscribe('RoutingComplete', ({ areaId, count }) => {
    const area = areas.find(item => item.id === areaId);
    bus.publish({
      type: 'AlertsQueued',
      activity: activity('Bangla Communicator', 'activity.alertsQueued', { areaId, count },
        `Simulated ${count} Bangla alerts for ${area.name}.`),
    });
  });
}
