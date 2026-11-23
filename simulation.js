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

// A rejected alert is raised again once the river climbs this much further.
export const REALERT_RISE = 0.25;

function monitor(state) {
  log(state, 'Monitor', 'Read river levels and 24-hour rainfall for all three demo areas.');
  areas.forEach((area, index) => {
    const risk = assess(index, state.tick);
    if (risk.severity !== 'Severe') return;
    const existing = state.alerts.filter(alert => alert.area === area.id);
    if (existing.some(alert => alert.status !== 'rejected')) return;
    const rejected = existing.at(-1);
    if (rejected && risk.level - (rejected.level ?? Infinity) < REALERT_RISE) return;
    state.alerts.push({ area: area.id, status: 'pending', tick: state.tick, level: risk.level, reraised: Boolean(rejected) });
    log(state, 'Risk Assessor', rejected
      ? `${area.name} rose to ${risk.level.toFixed(2)} m, ${(risk.level - rejected.level).toFixed(2)} m above the rejected alert. Re-raised for officer approval.`
      : `${area.name} reached ${risk.level.toFixed(2)} m, above the ${area.threshold.toFixed(2)} m demo danger threshold. Alert held for officer approval.`);
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

// Patterns are NFC-normalised so precomposed and decomposed Bangla letters (য়, ড়) both match.
const bn = source => new RegExp(source.normalize('NFC'), 'u');
const NUMBER_WORDS = Object.fromEntries(Object.entries({
  এক: 1, দুই: 2, দু: 2, তিন: 3, চার: 4, পাঁচ: 5, ছয়: 6, সাত: 7, আট: 8, নয়: 9, দশ: 10,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}).map(([word, value]) => [word.normalize('NFC'), value]));
const NUMBER_WORD_COUNT = bn(`(?:^|[\\s,.।])(${Object.keys(NUMBER_WORDS).join('|')})\\s*(?:জন|people|persons)`);
// Negated distress ("not stuck", "আটকে নেই") is removed before keyword matching.
const NEGATED_DISTRESS = bn('(?:\\b(?:not|no longer|never)\\s+(?:stuck|stranded|trapped)\\b)|(?:আটকে|আটকা)\\s*(?:নেই|নাই|পড়িনি)'
  + "|\\b(?:don'?t|do not|no)\\s+need(?:\\s+(?:for\\s+)?(?:any\\s+)?help)?\\b|(?:সাহায্য\\s*)?(?:দরকার|প্রয়োজন)\\s*(?:নেই|নাই)|(?:সাহায্য\\s*)?লাগবে\\s*না");
const NOT_SAFE = bn('নিরাপদ\\s*(?:নই|নয়|না)|নিরাপদে\\s*(?:নেই|নাই)|not safe|unsafe');
const RESCUE = bn('আটক|ছাদে|ছাদের|নৌকা|ডুবে|ডুব|stuck|stranded|trapped|roof|boat');
const MEDICAL = bn('অসুস্থ|আহত|চিকিৎসা|ডাক্তার|medical|injur|hurt|sick|doctor');
const HELP = bn('^2(?:\\s|[,.!?।]|$)|সাহায্য|উদ্ধার|দরকার|প্রয়োজন|লাগবে|\\bhelp\\b|\\bsos\\b|\\bneed\\b');
const SAFE = bn('^1(?:\\s|[,.!?।]|$)|নিরাপদ|ঠিক আছি|ভালো আছি|ভাল আছি|\\bsafe\\b|\\bfine\\b|\\bok(?:ay)?\\b|all good');

export function classifyReply(text) {
  const normalized = text.normalize('NFC').toLowerCase().replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit))).trim();
  const digits = normalized.match(/\b(\d{1,3})\s*(?:জন|people\b|persons\b)/u);
  const words = normalized.match(NUMBER_WORD_COUNT);
  const people = digits ? Number(digits[1]) || null : words ? NUMBER_WORDS[words[1]] ?? null : null;
  const cleaned = normalized.replace(new RegExp(NEGATED_DISTRESS.source, 'gu'), ' ');
  if (RESCUE.test(cleaned)) return { category: 'Rescue', people };
  if (MEDICAL.test(cleaned)) return { category: 'Medical', people };
  if (NOT_SAFE.test(cleaned) || HELP.test(cleaned)) return { category: 'Help needed', people };
  if (SAFE.test(cleaned)) return { category: 'Safe', people: null };
  return { category: 'Needs review', people };
}

export function receiveReply(state, recipientId, text) {
  const recipient = state.recipients.find(item => item.id === recipientId);
  const message = text.trim();
  if (!recipient || !message || message.length > 280) return false;
  const { category, people } = classifyReply(message);
  recipient.status = category;
  const active = state.cases.find(item => item.recipientId === recipientId && !item.resolved);
  if (category === 'Safe') {
    // A household that reports safe no longer needs a boat: close its open case and say why.
    if (active) {
      active.resolved = true;
      active.resolution = `Reported safe at ${timeline[state.tick].time}`;
    }
  } else {
    const incident = { recipientId, name: recipient.name, category, people, text: message, tick: state.tick };
    if (active) Object.assign(active, incident);
    else state.cases.unshift({ id: state.cases.length + 1, ...incident });
  }
  log(state, 'Rescue Triage', `${recipient.name} replied. Classified as ${category.toLowerCase()}.`
    + (category === 'Safe' && active ? ` Closed their open case.` : ''));
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
    if (recipient.status !== 'Awaiting reply' || recipient.sentAt >= state.tick) continue;
    if (!recipient.followedUp) {
      send(state, recipient, 'Follow-up', 'Voice call');
      recipient.followedUp = true;
      recipient.followedUpAt = state.tick;
      log(state, 'Orchestrator', `Queued a simulated Bangla voice follow-up for ${recipient.name} after no reply.`);
    } else if (recipient.followedUpAt < state.tick) {
      // Still silent after the follow-up call: escalate to a person on the ground.
      recipient.status = 'No response';
      state.cases.unshift({
        id: state.cases.length + 1, recipientId: recipient.id, name: recipient.name, category: 'No response',
        people: recipient.size, text: 'No reply to the alert or the voice follow-up. Ward volunteer asked to check in person.', tick: state.tick,
      });
      log(state, 'Orchestrator', `${recipient.name} is still silent after the follow-up. Escalated to the ward volunteer.`);
    }
  }
}
