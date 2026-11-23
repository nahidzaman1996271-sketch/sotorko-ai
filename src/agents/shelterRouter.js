import { activity } from '../core/events.js';

export function shelterSpace(state, shelter, excludingId) {
  // Use the current record when a caller kept a reference from a previous snapshot.
  const current = state.shelters.find(item => item.id === shelter.id) ?? shelter;
  const reserved = state.recipients
    .filter(recipient => recipient.shelter === current.id && recipient.id !== excludingId)
    .reduce((total, recipient) => total + recipient.size, 0);
  return Math.max(0, current.capacity - current.occupancy - reserved);
}

function routeNext(bus, state, { kind, areaId, count, remaining }) {
  const [recipient, ...next] = remaining;
  if (!recipient) {
    if (kind === 'Initial alert') bus.publish({ type: 'RoutingComplete', areaId, count });
    return;
  }

  const shelter = state.shelters
    .filter(item => item.area === recipient.area && shelterSpace(state, item, recipient.id) >= recipient.size)
    .sort((a, b) => a.distance - b.distance)[0];
  const householdId = recipient.id;
  const reroute = kind === 'Reroute';
  const reason = shelter
    ? activity('Shelter Router', reroute ? 'activity.shelterRerouted' : 'activity.shelterAssigned',
      { householdId, shelterId: shelter.id }, `${recipient.name} ${reroute ? 'rerouted' : 'assigned'} to ${shelter.name}.`)
    : activity('Shelter Router', reroute ? 'activity.shelterNoAlternate' : 'activity.shelterUnavailable',
      { householdId }, reroute ? `No alternate shelter has space for ${recipient.name}.` : `No shelter has space for ${recipient.name}'s household.`);

  bus.publish({
    type: 'ShelterAssigned',
    kind,
    recipient: { ...recipient, shelter: shelter?.id ?? null },
    routing: { kind, areaId, count, remaining: next },
    activity: reason,
  });
}

export function registerShelterRouter(bus, getState, households, shelters) {
  bus.subscribe('AlertApproved', ({ areaId }) => {
    const state = getState();
    const remaining = households.filter(item => item.area === areaId)
      .map(household => ({ ...household, status: 'Awaiting reply', sentAt: state.tick, followedUp: false }));
    routeNext(bus, state, { kind: 'Initial alert', areaId, count: remaining.length, remaining });
  });

  bus.subscribe('ShelterToggleRequested', ({ shelterId }) => {
    const shelter = getState().shelters.find(item => item.id === shelterId);
    const full = !shelter.full;
    const occupancy = full ? shelter.capacity : shelters.find(item => item.id === shelterId).occupancy;
    bus.publish({
      type: 'ShelterCapacityChanged',
      shelter: { ...shelter, full, occupancy },
      activity: activity('Shelter Router', full ? 'activity.shelterFull' : 'activity.shelterAvailable',
        { shelterId }, `${shelter.name} marked ${full ? 'full' : 'available'} in the simulation.`),
    });
  });

  bus.subscribe('ShelterCapacityChanged', ({ shelter }) => {
    const state = getState();
    const remaining = state.recipients.filter(recipient => (
      recipient.status !== 'Safe' && (shelter.full
        ? recipient.shelter === shelter.id
        : !recipient.shelter && recipient.area === shelter.area)
    ));
    routeNext(bus, state, { kind: 'Reroute', remaining });
  });

  // The reducer reserves space for this household before routing the next one.
  bus.subscribe('ShelterAssigned', ({ routing }) => routeNext(bus, getState(), routing));
}
