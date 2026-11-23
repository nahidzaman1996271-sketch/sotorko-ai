const replies = Object.freeze({
  safe: '১',
  help: '২',
  rescue: 'আমরা আটকে আছি, ৫ জন',
});

export function phoneReply(key) {
  return Object.hasOwn(replies, key) ? replies[key] : null;
}

export function householdMessages(state, recipient) {
  const own = state.outbox.filter(message => message.recipientId
    ? message.recipientId === recipient.id
    : message.recipient === recipient.name);
  return {
    alert: own.find(message => message.channel !== 'Voice call') ?? own[0],
    voice: own.find(message => message.channel === 'Voice call'),
  };
}
