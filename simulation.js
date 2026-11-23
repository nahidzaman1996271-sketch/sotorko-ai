export const areas = [
  { id: 'sylhet', name: 'Sylhet', bn: 'সিলেট', river: 'Surma', threshold: 5 },
  { id: 'chattogram', name: 'Chattogram', bn: 'চট্টগ্রাম', river: 'Karnaphuli', threshold: 5.5 },
  { id: 'sunamganj', name: 'Sunamganj', bn: 'সুনামগঞ্জ', river: 'Surma', threshold: 4.5 },
];

// Area order matches areas. Each reading is [river metres, 24-hour rain mm].
export const timeline = [
  { time: '08:00', readings: [[4.71, 76], [4.62, 55], [3.7, 38]] },
  { time: '08:15', readings: [[5.18, 103], [4.92, 74], [3.92, 49]] },
  { time: '08:30', readings: [[5.61, 121], [5.69, 102], [4.17, 65]] },
  { time: '08:45', readings: [[5.82, 135], [5.88, 113], [4.31, 81]] },
];

const households = [
  { id: 'rahima', name: 'Rahima', area: 'sylhet', size: 4, channel: 'Voice call' },
  { id: 'jamal', name: 'Jamal', area: 'sylhet', size: 5, channel: 'SMS' },
  { id: 'salma', name: 'Salma', area: 'sylhet', size: 3, channel: 'WhatsApp' },
  { id: 'mina', name: 'Mina', area: 'chattogram', size: 3, channel: 'SMS' },
  { id: 'karim', name: 'Karim', area: 'chattogram', size: 6, channel: 'Voice call' },
];

const shelters = [
  { id: 'school-a', name: 'Sylhet School Shelter', bn: 'সিলেট স্কুল আশ্রয়কেন্দ্র', area: 'sylhet', distance: 1.2, occupancy: 32, capacity: 50 },
  { id: 'school-b', name: 'Sylhet Community Hall', bn: 'সিলেট কমিউনিটি হল', area: 'sylhet', distance: 2.4, occupancy: 18, capacity: 50 },
  { id: 'school-c', name: 'Chattogram Civic Shelter', bn: 'চট্টগ্রাম নাগরিক আশ্রয়কেন্দ্র', area: 'chattogram', distance: 1.5, occupancy: 22, capacity: 50 },
];

export function assess(index, tick) {
  const area = areas[index];
  const [level, rain] = timeline[tick].readings[index];
  const [previous] = timeline[Math.max(0, tick - 1)].readings[index];
  const rise = Number((level - previous).toFixed(2));
  const score = Math.max(0, Math.min(100, Math.round(45 + (level - area.threshold) * 48 + (rain - 60) * 0.35 + rise * 20)));
  const severity = level >= area.threshold ? 'Severe' : score >= 35 ? 'Watch' : 'Normal';
  return { level, rain, rise, score, severity };
}

function log(state, agent, message) {
  state.activity.unshift({ tick: state.tick, agent, message });
}

function monitor(state) {
  log(state, 'Monitor', 'Read river levels and 24-hour rainfall for all three demo areas.');
  areas.forEach((area, index) => {
    const risk = assess(index, state.tick);
    if (risk.severity !== 'Severe' || state.alerts.some(alert => alert.area === area.id)) return;
    state.alerts.push({ area: area.id, status: 'pending', tick: state.tick });
    log(state, 'Risk Assessor', `${area.name} reached ${risk.level.toFixed(2)} m, above the ${area.threshold.toFixed(2)} m demo danger threshold. Alert held for officer approval.`);
  });
}

export function initialState() {
  const state = { tick: 0, alerts: [], shelters: structuredClone(shelters), recipients: [], outbox: [], cases: [], activity: [] };
  monitor(state);
  return state;
}

export function advance(state) {
  if (state.tick >= timeline.length - 1) return false;
  state.tick += 1;
  monitor(state);
  followUp(state);
  return true;
}

export function shelterSpace(state, shelter) {
  const reserved = state.recipients
    .filter(recipient => recipient.shelter === shelter.id)
    .reduce((total, recipient) => total + recipient.size, 0);
  return Math.max(0, shelter.capacity - shelter.occupancy - reserved);
}

function assign(state, recipient) {
  const shelter = state.shelters
    .filter(item => item.area === recipient.area && shelterSpace(state, item) >= recipient.size)
    .sort((a, b) => a.distance - b.distance)[0];
  recipient.shelter = shelter?.id ?? null;
  return shelter;
}

function send(state, recipient, kind, channel = recipient.channel) {
  const area = areas.find(item => item.id === recipient.area);
  const shelter = state.shelters.find(item => item.id === recipient.shelter);
  const intro = kind === 'Reroute' ? 'বন্যা মহড়া: আপনার আশ্রয়কেন্দ্র পরিবর্তন হয়েছে।'
    : kind === 'Follow-up' ? 'বন্যা মহড়া: আপনার অবস্থা জানান।'
    : `বন্যা মহড়া: ${area.bn} এলাকায় বন্যার ঝুঁকি বেড়েছে।`;
  const destination = shelter ? `মহড়ায় আপনার জন্য নির্ধারিত আশ্রয়কেন্দ্র: ${shelter.bn}।` : 'মহড়ায় কোনো আশ্রয়কেন্দ্রে খালি জায়গা নেই।';
  const instruction = channel === 'Voice call' ? 'চাপুন' : 'লিখে পাঠান';
  state.outbox.unshift({
    id: state.outbox.length + 1,
    tick: state.tick,
    recipient: recipient.name,
    channel,
    kind,
    text: `${intro} ${destination} নিরাপদ থাকলে ১, সাহায্য প্রয়োজন হলে ২ ${instruction}।`,
  });
}

export function decideAlert(state, areaId, approved) {
  const alert = state.alerts.find(item => item.area === areaId && item.status === 'pending');
  if (!alert) return false;
  const area = areas.find(item => item.id === areaId);
  alert.status = approved ? 'approved' : 'rejected';
  log(state, 'Officer', `${approved ? 'Approved' : 'Rejected'} the severe ${area.name} alert.`);
  if (!approved) return true;
  const recipients = households.filter(item => item.area === areaId);
  for (const household of recipients) {
    const recipient = { ...household, status: 'Awaiting reply', sentAt: state.tick, followedUp: false };
    const shelter = assign(state, recipient);
    state.recipients.push(recipient);
    log(state, 'Shelter Router', shelter ? `${recipient.name} assigned to ${shelter.name}.` : `No shelter has space for ${recipient.name}'s household.`);
    send(state, recipient, 'Initial alert');
  }
  log(state, 'Bangla Communicator', `Simulated ${recipients.length} Bangla alerts for ${area.name}.`);
  return true;
}

export function toggleShelter(state, shelterId) {
  const shelter = state.shelters.find(item => item.id === shelterId);
  if (!shelter) return false;
  shelter.full = !shelter.full;
  shelter.occupancy = shelter.full ? shelter.capacity : shelters.find(item => item.id === shelterId).occupancy;
  log(state, 'Shelter Router', `${shelter.name} marked ${shelter.full ? 'full' : 'available'} in the simulation.`);
  const affected = state.recipients.filter(recipient => (
    recipient.status !== 'Safe' && (shelter.full ? recipient.shelter === shelterId : !recipient.shelter && recipient.area === shelter.area)
  ));
  for (const recipient of affected) {
    recipient.shelter = null;
    const replacement = assign(state, recipient);
    log(state, 'Shelter Router', replacement ? `${recipient.name} rerouted to ${replacement.name}.` : `No alternate shelter has space for ${recipient.name}.`);
    send(state, recipient, 'Reroute');
  }
  return true;
}

export function classifyReply(text) {
  const normalized = text.normalize('NFC').toLowerCase().replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit))).trim();
  const count = normalized.match(/\b(\d{1,3})\s*(?:জন|people\b|persons\b)/u);
  const people = count ? Number(count[1]) || null : null;
  if (/আটক|আটকে|ছাদে|নৌকা|ডুব|stuck|stranded|roof|boat/.test(normalized)) return { category: 'Rescue', people };
  if (/অসুস্থ|আহত|চিকিৎসা|medical|injur|hurt/.test(normalized)) return { category: 'Medical', people };
  if (/^2(?:\s|[,.!?।]|$)|সাহায্য|help|নিরাপদ ন|not safe/.test(normalized)) return { category: 'Help needed', people };
  if (/^(?:1|নিরাপদ|নিরাপদে আছি|আমি নিরাপদে আছি|আমরা নিরাপদে আছি|safe|i(?: am|'m) safe|we(?: are|'re) safe)[\s.!।]*$/.test(normalized)) return { category: 'Safe', people: null };
  return { category: 'Needs review', people };
}

export function receiveReply(state, recipientId, text) {
  const recipient = state.recipients.find(item => item.id === recipientId);
  const message = text.trim();
  if (!recipient || !message || message.length > 280) return false;
  const { category, people } = classifyReply(message);
  recipient.status = category;
  if (category !== 'Safe') {
    const active = state.cases.find(item => item.recipientId === recipientId && !item.resolved);
    const incident = { recipientId, name: recipient.name, category, people, text: message, tick: state.tick };
    if (active) Object.assign(active, incident);
    else state.cases.unshift({ id: state.cases.length + 1, ...incident });
  }
  log(state, 'Rescue Triage', `${recipient.name} replied. Classified as ${category.toLowerCase()}.`);
  return true;
}

export function resolveCase(state, caseId) {
  const incident = state.cases.find(item => item.id === caseId && !item.resolved);
  if (!incident) return false;
  incident.resolved = true;
  log(state, 'Officer', `Closed ${incident.name}'s simulated case.`);
  return true;
}

function followUp(state) {
  for (const recipient of state.recipients) {
    if (recipient.status !== 'Awaiting reply' || recipient.sentAt >= state.tick || recipient.followedUp) continue;
    send(state, recipient, 'Follow-up', 'Voice call');
    recipient.followedUp = true;
    log(state, 'Orchestrator', `Queued a simulated Bangla voice follow-up for ${recipient.name} after no reply.`);
  }
}
