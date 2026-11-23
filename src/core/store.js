export function createInitialState(shelters) {
  return { tick: 0, alerts: [], shelters: structuredClone(shelters), recipients: [], outbox: [], cases: [], activity: [] };
}

function updateRecipient(recipients, id, changes) {
  return recipients.map(recipient => recipient.id === id ? { ...recipient, ...changes } : recipient);
}

function reduce(state, event) {
  switch (event.type) {
    case 'ReplayAdvanced':
      return { ...state, tick: event.tick };
    case 'AlertRaised':
      return { ...state, alerts: [...state.alerts, event.alert] };
    case 'AlertApproved':
    case 'AlertRejected': {
      const status = event.type === 'AlertApproved' ? 'approved' : 'rejected';
      const alerts = state.alerts.map(alert => alert.area === event.areaId && alert.status === 'pending'
        ? { ...alert, status }
        : alert);
      return { ...state, alerts };
    }
    case 'ShelterCapacityChanged':
      return { ...state, shelters: state.shelters.map(shelter => shelter.id === event.shelter.id ? event.shelter : shelter) };
    case 'ShelterAssigned': {
      const recipients = event.kind === 'Initial alert'
        ? [...state.recipients, event.recipient]
        : updateRecipient(state.recipients, event.recipient.id, { shelter: event.recipient.shelter });
      return { ...state, recipients };
    }
    case 'MessageQueued': {
      const message = { id: state.outbox.length + 1, tick: state.tick, ...event.message };
      const recipients = message.kind === 'Follow-up'
        ? updateRecipient(state.recipients, message.recipientId, { followedUp: true, followedUpAt: state.tick })
        : state.recipients;
      return { ...state, recipients, outbox: [message, ...state.outbox] };
    }
    case 'ReplyClassified':
      return { ...state, recipients: updateRecipient(state.recipients, event.recipientId, { status: event.category }) };
    case 'Escalated':
      return { ...state, recipients: updateRecipient(state.recipients, event.recipientId, { status: 'No response' }) };
    case 'CaseOpened': {
      const active = state.cases.find(incident => incident.recipientId === event.incident.recipientId && !incident.resolved);
      const cases = active
        ? state.cases.map(incident => incident === active ? { id: incident.id, ...event.incident } : incident)
        : [{ id: state.cases.length + 1, ...event.incident }, ...state.cases];
      return { ...state, cases };
    }
    case 'CaseResolved':
      return { ...state, cases: state.cases.map(incident => incident.id === event.caseId
        ? { ...incident, resolved: true, ...event.resolution }
        : incident) };
    default:
      return state;
  }
}

export function reduceEvent(state, event) {
  const result = reduce(state, event);
  if (!event.activity) return result;
  return { ...result, activity: [{ tick: result.tick, ...event.activity }, ...result.activity] };
}

export function createStore(initialState) {
  let state = initialState;
  return {
    getState: () => state,
    dispatch(event) {
      state = reduceEvent(state, event);
    },
  };
}
