export function createEventBus(reduceEvent = () => {}) {
  const subscribers = new Map();
  const queue = [];
  let dispatching = false;

  function subscribe(type, listener) {
    const listeners = subscribers.get(type) ?? new Set();
    listeners.add(listener);
    subscribers.set(type, listeners);
    return () => listeners.delete(listener);
  }

  function publish(event) {
    queue.push(event);
    if (dispatching) return;
    dispatching = true;
    try {
      while (queue.length) {
        const next = queue.shift();
        reduceEvent(next);
        for (const listener of [...(subscribers.get(next.type) ?? [])]) listener(next);
      }
    } finally {
      queue.length = 0;
      dispatching = false;
    }
  }

  return { subscribe, publish };
}

export function activity(agent, messageKey, params, message) {
  return { agent, messageKey, params, message };
}
