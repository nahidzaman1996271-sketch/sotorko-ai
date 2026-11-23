import { activity } from '../core/events.js';

export function registerMonitor(bus, dataSource) {
  const read = ({ tick }) => {
    const readings = dataSource.read(tick);
    bus.publish({
      type: 'ReadingReceived',
      readings,
      activity: activity('Monitor', 'activity.monitor', { count: readings.length },
        'Read river levels and 24-hour rainfall for all three demo areas.'),
    });
  };
  bus.subscribe('ReplayStarted', read);
  bus.subscribe('ReplayAdvanced', read);
}
