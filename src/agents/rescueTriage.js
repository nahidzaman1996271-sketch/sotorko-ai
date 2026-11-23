import { activity } from '../core/events.js';

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

export function registerRescueTriage(bus, getState, timeline) {
  bus.subscribe('ReplyReceived', ({ recipientId, message }) => {
    const state = getState();
    const recipient = state.recipients.find(item => item.id === recipientId);
    const { category, people } = classifyReply(message);
    const active = state.cases.find(item => item.recipientId === recipientId && !item.resolved);
    const closedCase = category === 'Safe' && active;
    bus.publish({
      type: 'ReplyClassified',
      recipientId,
      category,
      activity: activity('Rescue Triage', closedCase ? 'activity.replyClosedCase' : 'activity.replyClassified',
        { householdId: recipientId, category },
        `${recipient.name} replied. Classified as ${category.toLowerCase()}.${closedCase ? ' Closed their open case.' : ''}`),
    });

    if (closedCase) {
      const time = timeline[state.tick].time;
      bus.publish({
        type: 'CaseResolved',
        caseId: active.id,
        resolution: { resolution: `Reported safe at ${time}`, resolutionKey: 'case.reportedSafe', resolutionParams: { time } },
      });
    } else if (category !== 'Safe') {
      bus.publish({
        type: 'CaseOpened',
        incident: { recipientId, name: recipient.name, category, people, text: message, tick: state.tick },
      });
    }
  });

  bus.subscribe('Escalated', ({ recipientId }) => {
    const state = getState();
    const recipient = state.recipients.find(item => item.id === recipientId);
    bus.publish({
      type: 'CaseOpened',
      incident: {
        recipientId,
        name: recipient.name,
        category: 'No response',
        people: recipient.size,
        text: 'No reply to the alert or the voice follow-up. Ward volunteer asked to check in person.',
        textKey: 'case.noResponse',
        tick: state.tick,
      },
    });
  });
}

