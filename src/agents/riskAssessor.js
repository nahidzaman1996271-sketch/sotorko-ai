import { activity } from '../core/events.js';

// A rejected alert is raised again once the river climbs this much further.
export const REALERT_RISE = 0.25;

export function assessReading({ area, level, rain, previousLevel }) {
  const rise = Number((level - previousLevel).toFixed(2));
  const score = Math.max(0, Math.min(100, Math.round(45 + (level - area.threshold) * 48 + (rain - 60) * 0.35 + rise * 20)));
  const severity = level >= area.threshold ? 'Severe' : score >= 35 ? 'Watch' : 'Normal';
  return { level, rain, rise, score, severity };
}

export function registerRiskAssessor(bus, getState) {
  bus.subscribe('ReadingReceived', ({ readings }) => {
    for (const reading of readings) {
      const { area } = reading;
      const risk = assessReading(reading);
      bus.publish({
        type: 'RiskAssessed',
        area,
        risk,
        activity: activity('Risk Assessor', 'activity.riskAssessed',
          { areaId: area.id, level: risk.level, score: risk.score, severity: risk.severity },
          `${area.name} scored ${risk.score}/100 (${risk.severity}) at ${risk.level.toFixed(2)} m.`),
      });
    }
  });

  bus.subscribe('RiskAssessed', ({ area, risk }) => {
    if (risk.severity !== 'Severe') return;
    const state = getState();
    const existing = state.alerts.filter(alert => alert.area === area.id);
    if (existing.some(alert => alert.status !== 'rejected')) return;
    const rejected = existing.at(-1);
    const rise = risk.level - (rejected?.level ?? Infinity);
    if (rejected && rise < REALERT_RISE) return;
    const params = { areaId: area.id, level: risk.level };
    bus.publish({
      type: 'AlertRaised',
      alert: { area: area.id, status: 'pending', tick: state.tick, level: risk.level, reraised: Boolean(rejected) },
      activity: rejected
        ? activity('Risk Assessor', 'activity.alertReraised', { ...params, rise },
          `${area.name} rose to ${risk.level.toFixed(2)} m, ${rise.toFixed(2)} m above the rejected alert. Re-raised for officer approval.`)
        : activity('Risk Assessor', 'activity.alertRaised', { ...params, threshold: area.threshold },
          `${area.name} reached ${risk.level.toFixed(2)} m, above the ${area.threshold.toFixed(2)} m demo danger threshold. Alert held for officer approval.`),
    });
  });
}
