const finalTick = 3;

export function guideStep(state) {
  const approved = state.alerts.some(alert => alert.area === 'sylhet' && alert.status === 'approved');
  const pending = state.alerts.some(alert => alert.area === 'sylhet' && alert.status === 'pending');
  const recipient = id => state.recipients.find(item => item.id === id);
  const rescue = state.cases.some(item => item.recipientId === 'jamal' && item.category === 'Rescue');
  const escalation = state.cases.some(item => item.recipientId === 'salma' && item.category === 'No response');

  if (state.tick === 0) return { step: 1, selector: '#advance' };
  if (!approved) {
    if (pending && state.tick === 1) return { step: 2, selector: '[data-action="approve"][data-id="sylhet"]' };
    return { step: 2, restart: true };
  }
  const sylhet = state.recipients.filter(item => item.area === 'sylhet');
  const routedByCapacity = state.shelters.some(shelter => shelter.id === 'school-a' && shelter.full)
    && sylhet.some(item => item.shelter === 'school-b');
  const completedRoute = routedByCapacity || state.outbox.some(message =>
    message.kind === 'Reroute' && sylhet.some(item => item.id === message.recipientId || item.name === message.recipient));
  if (!completedRoute) return { step: 3, selector: '[data-action="shelter"][data-id="school-a"]' };
  if (recipient('rahima')?.status !== 'Safe') return { step: 4, household: 'rahima', selector: '#phone-safe' };
  if (!rescue) return { step: 4, household: 'jamal', selector: '#phone-rescue' };
  if (state.tick < 2) return { step: 5, selector: '#advance' };
  if (state.tick < finalTick) return { step: 6, selector: '#advance' };
  return escalation ? { step: 7, selector: '#triage' } : { step: 6, restart: true };
}
