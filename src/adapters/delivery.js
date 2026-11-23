// The browser bus records this preview in the outbox without contacting a provider.
export const previewDelivery = {
  queue(message) {
    return { ...message };
  },
};
