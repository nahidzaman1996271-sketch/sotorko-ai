import { areas, timeline } from '../adapters/dataSource.js';
import { formatNumber, formatTime, t } from './i18n.js';

export function shiftHandover(state, language) {
  const label = (key, params) => t(language, key, params);
  const time = formatTime(language, timeline[state.tick].time);
  const districts = areas.map(area => {
    const households = state.recipients.filter(item => item.area === area.id);
    const ids = new Set(households.map(item => item.id));
    const open = state.cases.filter(item => ids.has(item.recipientId) && !item.resolved);
    const counts = {
      alerted: households.length,
      safe: households.filter(item => item.status === 'Safe').length,
      awaiting: households.filter(item => item.status === 'Awaiting reply').length,
      open: open.length,
    };
    const pending = state.alerts.some(item => item.area === area.id && item.status === 'pending');
    const action = open.length ? 'triage' : pending ? 'alerts' : counts.awaiting ? 'replies' : 'river-panel';
    const name = label('area.' + area.id);
    const figures = Object.fromEntries(Object.entries(counts).map(([key, n]) => [key, formatNumber(language, n)]));
    const summary = label('shift.figures', figures);
    return { name, counts, summary, action, next: label('shift.' + action) };
  });
  const stamp = label('shift.time', { time });
  const report = [label('shift.title'), label('hero.notice'), stamp, '',
    ...districts.flatMap(d => [d.name, d.summary, d.next, ''])].join('\n');
  return { districts, stamp, report };
}
