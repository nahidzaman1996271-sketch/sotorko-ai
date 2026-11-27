import {
  advance, areas, assess, decideAlert, initialState, receiveReply, resolveCase, shelterSpace, timeline, toggleShelter,
} from './simulation.js';
import { createBasinGraphic } from './basin.js';
import { householdMessages, phoneReply } from './src/ui/citizenPhone.js';
import { shiftHandover } from './src/ui/handover.js';
import { guideStep } from './src/ui/guidedDemo.js';
import { formatNumber, formatTime, readLanguage, t, translateStatic, writeLanguage } from './src/ui/i18n.js';

const element = id => document.getElementById(id);
const storageKey = 'sotorko-demo-v3';
const chart = element('chart');
const chartSurface = element('chart-interactive');
const river = element('river');
const phoneBreakpoint = window.matchMedia('(max-width: 719px)');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const preferences = (() => {
  try { return window.localStorage; } catch { return null; }
})();
let language = readLanguage(preferences);
let phoneHousehold = '';
let phoneView = 'alert';
let guidedControl;
let guidePreview = null;
let guideOpener;
let chartPoints = [];
let chartIndex = null;
let previousMetrics;
let metricDeltas;
const shownMessages = new Set();
const shownActivity = new WeakSet();
const aiReviews = new Map();
const aiEnabled = document.querySelector('meta[name="sotorko-ai-review"]')?.content === 'enabled';
const basin = createBasinGraphic(element('basin-art'), element('motion-toggle'), motionPreference, areas);
let chartFrame = 0;
let state = initialState();

try {
  const saved = JSON.parse(preferences?.getItem(storageKey) ?? 'null');
  // Only restore a run that matches the current replay; anything else falls back to a fresh start.
  const valid = saved && Number.isInteger(saved.tick) && saved.tick >= 0 && saved.tick < timeline.length
    && ['alerts', 'shelters', 'recipients', 'outbox', 'cases', 'activity'].every(key => Array.isArray(saved[key]))
    && saved.shelters.length === state.shelters.length;
  if (valid) state = saved;
} catch {
  // The replay still works when browser storage is unavailable.
}

const esc = text => String(text).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const translate = (key, params) => t(language, key, params);
const copy = (key, params) => esc(translate(key, params));
const number = (value, options) => formatNumber(language, value, options);
const timeAt = tick => formatTime(language, timeline[tick].time);
const statusName = status => translate(`status.${status}`);
const areaName = id => translate(`area.${id}`);
const shelterName = id => translate(`shelter.${id}`);
const householdName = id => translate(`household.${id}`);
const channelName = channel => translate(`channel.${channel}`);
const badge = (label, text = statusName(label)) =>
  `<span class="badge ${esc(label.toLowerCase().replaceAll(' ', '-'))}">${esc(text)}</span>`;
const empty = text => `<p class="empty">${text}</p>`;
const action = (name, id, label, skin = 'secondary') =>
  `<button class="button ${skin}" type="button" data-action="${name}" data-id="${id}">${label}</button>`;
const item = (content, className = '') => `<div class="stack-item ${className}">${content}</div>`;
const row = (heading, detail) => `<div class="row"><strong>${heading}</strong>${detail}</div>`;
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
const decimal = value => number(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const urgency = ['Rescue', 'Medical', 'Help needed', 'No response', 'Needs review'];
const urgencyOf = item => {
  const position = urgency.indexOf(item.category);
  return item.resolved ? urgency.length : position < 0 ? urgency.length - 1 : position;
};
const agentIcons = {
  Monitor: 'monitor', 'Risk Assessor': 'assess', Officer: 'approve', 'Shelter Router': 'shelter',
  'Bangla Communicator': 'notify', 'Rescue Triage': 'triage', Orchestrator: 'escalate',
};

element('shift-download').addEventListener('click', () => {
  const report = shiftHandover(state, language).report;
  const url = URL.createObjectURL(new Blob(['\uFEFF', report], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `sotorko-handover-${timeline[state.tick].time.replace(':', '')}-${language}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

river.addEventListener('change', () => {
  chartIndex = null;
  drawChart();
});
new ResizeObserver(() => drawChart()).observe(chart);

function render(replayAdvanced = false, animateChanges = false) {
  const currentRiver = river.value;
  river.innerHTML = areas.map((area, index) => `<option value="${index}">${esc(areaName(area.id))}</option>`).join('');
  river.value = currentRiver || '0';
  element('advance').disabled = state.tick === timeline.length - 1;
  element('advance').textContent = translate(element('advance').disabled ? 'hero.complete' : 'hero.advance');
  const brief = shiftHandover(state, language);
  element('shift-stamp').textContent = brief.stamp;
  element('shift-districts').innerHTML = brief.districts.map(d => `<article data-priority="${d.action}"><h3>${esc(d.name)}</h3><p class="meta">${esc(d.summary)}</p><a href="#${d.action}" aria-label="${esc(d.name)} · ${esc(d.next)}">${esc(d.next)} →</a></article>`).join('');
  renderMetrics(animateChanges);
  renderPipeline();
  element('overview').style.setProperty('--replay-progress', state.tick / (timeline.length - 1));

  const readings = areas.map((_, index) => assess(index, state.tick));
  element('areas').innerHTML = readings.map((reading, index) => {
    const area = areas[index];
    const name = areaName(area.id);
    const weather = {
      river: translate(`riverName.${area.river}`),
      level: decimal(reading.level),
      rain: number(reading.rain),
    };
    const limit = decimal(area.threshold);
    const scale = Math.max(area.threshold * 1.4, reading.level);
    const bar = `<div class="level-track" role="img" aria-label="${copy('risk.levelBar', { level: weather.level, threshold: limit })}"
      style="--level:${reading.level / scale * 100}%;--limit:${area.threshold / scale * 100}%"><i></i><b></b></div>`;
    return `<div class="area ${reading.severity.toLowerCase()}">${row(esc(name), badge(reading.severity))}
      <p class="meta">${copy('risk.weather', weather)}</p>
      <div class="risk-scale">${bar}<span class="meta">${copy('risk.levelAgainstThreshold', { level: weather.level, threshold: limit })}</span></div>
      <p class="meta">${copy('risk.score', { score: number(reading.score) })}</p></div>`;
  }).join('');
  basin.update(readings.map(reading => reading.severity), {
    labels: areas.map(area => areaName(area.id)),
    pause: translate('hero.pauseMotion'),
    play: translate('hero.playMotion'),
    language,
  });

  element('approval-list').innerHTML = state.alerts.map(alert => {
    const status = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }[alert.status];
    const buttons = alert.status === 'pending'
      ? `<div class="form-actions">${action('approve', alert.area, copy('alerts.approve'), 'primary')}${action('reject', alert.area, copy('alerts.reject'), 'quiet')}</div>`
      : '';
    const note = copy(alert.reraised ? 'alerts.reraised' : 'alerts.thresholdCrossed', { time: timeAt(alert.tick) });
    const tags = `<span class="badges">${badge(status)}${alert.reraised ? badge('reraised', translate('alerts.reraisedTag')) : ''}</span>`;
    return `<article class="stack-item approval-card" data-status="${esc(alert.status)}">${row(esc(areaName(alert.area)), tags)}<p class="meta">${note}</p>${buttons}</article>`;
  }).join('') || empty(copy('alerts.empty'));

  element('shelter-list').innerHTML = state.shelters.map(shelter => {
    const spaces = shelterSpace(state, shelter);
    const buttonLabel = copy(shelter.full ? 'shelters.markAvailable' : 'shelters.simulateFull');
    const name = shelterName(shelter.id);
    return item(`${row(esc(name), badge('capacity', translate('shelters.capacityFree', { count: number(spaces), total: number(shelter.capacity) })))}
      <progress max="${shelter.capacity}" value="${shelter.capacity - spaces}" aria-label="${copy('shelters.placesUsed', { shelter: name })}"></progress>
      <div class="row"><p class="meta">${copy('shelters.stats', {
        area: areaName(shelter.area), distance: number(shelter.distance), capacity: number(shelter.capacity),
      })}</p>
      ${action('shelter', shelter.id, buttonLabel)}</div>`);
  }).join('');

  renderReplies();
  renderPhone();
  element('message-list').innerHTML = state.outbox.map(message => {
    const fresh = animateChanges && !shownMessages.has(message.id);
    shownMessages.add(message.id);
    return item(`${row(esc(displayRecipient(message)), badge(message.channel, channelName(message.channel)))}
      <p class="meta">${timeAt(message.tick)} · ${copy(`messageKind.${message.kind}`)}</p>
      <p class="message" lang="bn">${esc(message.text)}</p>
      ${message.channel === 'Voice call' ? `<div class="form-actions">${action('voice', message.id, copy('messages.playBangla'))}</div>` : ''}`,
    fresh ? 'is-new' : '');
  }).join('') || empty(copy('messages.empty'));

  element('activity-list').innerHTML = state.activity.map(entry => {
    const agent = entry.agent.toLowerCase().replaceAll(' ', '-');
    const fresh = animateChanges && !shownActivity.has(entry);
    shownActivity.add(entry);
    const agentName = copy(`agent.${entry.agent}`);
    const heading = entry.messageKey ? copy(entry.messageKey.replace('activity.', 'timeline.')) : agentName;
    return `<article class="stack-item activity-item${fresh ? ' is-new' : ''}" data-agent="${esc(agent)}">
      <span class="activity-marker" aria-hidden="true">${icon(agentIcons[entry.agent] ?? 'monitor')}</span>
      ${row(heading, `<time class="meta" datetime="${timeline[entry.tick].time}">${timeAt(entry.tick)}</time>`)}
      ${entry.messageKey ? `<p class="meta">${agentName}</p>` : ''}
      <p class="activity-reason"${entry.messageKey ? '' : ' lang="en"'}>${activityMessage(entry)}</p></article>`;
  }).join('');
  renderGuide();

  for (const id of ['message-list', 'activity-list']) {
    const list = element(id);
    list.tabIndex = list.scrollHeight > list.clientHeight ? 0 : -1;
  }
  cancelAnimationFrame(chartFrame);
  if (replayAdvanced && !motionPreference.matches && !basin.paused) {
    const start = performance.now();
    const animate = now => {
      const progress = Math.min(1, (now - start) / 520);
      drawChart(1 - (1 - progress) ** 3);
      if (progress < 1 && !motionPreference.matches && !basin.paused) chartFrame = requestAnimationFrame(animate);
      else drawChart();
    };
    chartFrame = requestAnimationFrame(animate);
  } else {
    drawChart();
  }
}

function renderMetrics(animateChanges) {
  const values = [
    state.tick,
    state.alerts.filter(alert => alert.status === 'pending').length,
    state.outbox.length,
    state.cases.filter(incident => !incident.resolved).length,
  ];
  const labels = ['time', 'approvals', 'messages', 'cases'];
  const details = ['replayRange', 'approvalsDetail', 'messagesDetail', 'casesDetail'];
  const symbols = ['clock', 'approve', 'notify', 'triage'];
  const previous = previousMetrics;
  const animate = animateChanges && !motionPreference.matches && previous;
  if (!metricDeltas || values.some((value, index) => value !== previous[index])) {
    metricDeltas = values.map((value, index) => previous ? value - previous[index] : 0);
  }
  previousMetrics = values;
  const summary = element('summary');
  summary.innerHTML = values.map((value, index) => {
    const first = index === 0;
    const delta = metricDeltas[index];
    const caption = first && delta > 0 ? copy('metric.timeDelta', { count: number(delta * 15) })
      : !first && delta ? copy('metric.delta', { delta: number(delta, { signDisplay: 'always' }) })
      : copy(`metric.${details[index]}`, { start: timeAt(0), end: timeAt(timeline.length - 1) });
    const shown = animate ? previous[index] : value;
    return `<dl class="metric"><dt>${icon(symbols[index])}${copy(`metric.${labels[index]}`)}</dt>
      <dd class="metric-value">${first ? timeAt(shown) : number(shown)}</dd><dd class="metric-detail">${caption}</dd></dl>`;
  }).join('');
  if (!animate) return;
  const minutes = tick => {
    const [hour, minute] = timeline[tick].time.split(':').map(Number);
    return hour * 60 + minute;
  };
  summary.querySelectorAll('.metric-value').forEach((node, index) => {
    if (previous[index] === values[index]) return;
    const start = index ? previous[index] : minutes(previous[index]);
    const end = index ? values[index] : minutes(values[index]);
    const now = performance.now();
    const locale = language;
    const count = timestamp => {
      if (!node.isConnected) return;
      const progress = motionPreference.matches ? 1 : Math.min((timestamp - now) / 200, 1);
      const value = Math.round(start + (end - start) * progress);
      node.textContent = index ? formatNumber(locale, value) : formatTime(locale,
        [Math.floor(value / 60), value % 60].map(part => String(part).padStart(2, '0')).join(':'));
      if (progress < 1) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
  });
}

function renderPipeline() {
  const workflowStep = guideStep(state).step;
  const active = [0, 0, 2, 3, 5, 6, 7, 7][workflowStep];
  const complete = workflowStep === 7;
  const pending = state.alerts.some(alert => alert.status === 'pending');
  document.querySelectorAll('[data-pipeline]').forEach(link => {
    const index = Number(link.dataset.pipeline);
    const status = complete && pending && index === 2 ? 'active'
      : complete || index < active ? 'done' : index === active ? 'active' : 'upcoming';
    link.dataset.replay = status;
    if (status === 'active') link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
    link.querySelector('.pipeline-check')?.remove();
    link.querySelector('.pipeline-description')?.remove();
    if (status === 'done') {
      link.insertAdjacentHTML('beforeend', `<span class="pipeline-check" aria-hidden="true">${icon('check')}</span>
        <span class="pipeline-description sr-only"> · ${copy('pipeline.done')}</span>`);
    }
  });
}

function animateApproval() {
  if (motionPreference.matches) return;
  document.querySelectorAll('[data-pipeline="2"], [data-pipeline="3"], [data-pipeline="4"]').forEach((link, index) => {
    link.animate([{ boxShadow: 'inset 0 0 0 1px transparent' }, { boxShadow: 'inset 0 0 0 2px #3fd0c9' }, { boxShadow: 'inset 0 0 0 1px transparent' }],
      { delay: index * 90, duration: 210, easing: 'ease-out' });
  });
}

function renderReplies() {
  const hasRecipients = state.recipients.length > 0;
  element('reply-empty').hidden = hasRecipients;
  element('reply-form').hidden = !hasRecipients;
  const select = element('household');
  const previous = select.value;
  select.innerHTML = state.recipients.map(recipient =>
    `<option value="${esc(recipient.id)}">${esc(householdName(recipient.id))} · ${esc(areaName(recipient.area))}</option>`).join('');
  if (state.recipients.some(recipient => recipient.id === previous)) select.value = previous;

  element('recipient-list').innerHTML = state.recipients.map(recipient => {
    const shelter = state.shelters.find(shelter => shelter.id === recipient.shelter);
    return item(`${row(esc(householdName(recipient.id)), badge(recipient.status))}
      <p class="meta">${esc(channelName(recipient.channel))} · ${shelter ? esc(shelterName(shelter.id)) : copy('shelters.unassigned')}</p>`);
  }).join('');
  const openFirst = [...state.cases].sort((a, b) => urgencyOf(a) - urgencyOf(b) || b.tick - a.tick);
  element('case-list').innerHTML = openFirst.map(incident => {
    const automatic = incident.category === 'No response';
    const people = incident.people === null ? copy('case.groupUnknown')
      : copy(automatic ? 'case.householdCount' : 'case.reportedCount', { count: number(incident.people) });
    const reportedTime = incident.resolutionParams?.time ?? incident.resolution?.match(/Reported safe at (\d\d:\d\d)/)?.[1];
    const resolution = reportedTime ? copy('case.reportedSafe', { time: formatTime(language, reportedTime) })
      : esc(incident.resolution ?? '');
    const text = automatic ? copy('case.noResponse') : esc(incident.text);
    const textLanguage = automatic ? language : /\p{Script=Bengali}/u.test(incident.text) ? 'bn' : 'en';
    const review = aiReviews.get(incident.id);
    const currentReview = review?.text === incident.text && review.locale === language ? review : null;
    const shouldReview = aiEnabled && !automatic && !incident.resolved;
    const reviewPanel = shouldReview ? renderReview(incident, currentReview) : '';
    return `<article class="stack-item triage-card" data-urgency="${urgencyOf(incident)}">
      ${row(esc(householdName(incident.recipientId)), badge(incident.resolved ? 'Closed' : incident.category))}
      <p class="meta">${timeAt(incident.tick)} · ${people}${resolution ? ` · ${resolution}` : ''}</p>
      <p class="message" dir="auto" lang="${textLanguage}">${text}</p>
      ${incident.resolved ? '' : `<div class="form-actions">${action('resolve', incident.id, copy('case.close'))}${reviewPanel}</div>`}</article>`;
  }).join('') || empty(copy('case.empty'));
}

function displayRecipient(message) {
  const id = message.recipientId ?? state.recipients.find(item => item.name === message.recipient)?.id;
  return id ? householdName(id) : message.recipient;
}

function activityMessage(entry) {
  if (!entry.messageKey) return esc(entry.message);
  const params = { ...entry.params };
  for (const key of ['count', 'level', 'score', 'threshold', 'rise']) {
    if (typeof params[key] === 'number') {
      const precision = ['level', 'threshold', 'rise'].includes(key) ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined;
      params[key] = number(params[key], precision);
    }
  }
  if (params.areaId) params.areaId = areaName(params.areaId);
  if (params.householdId) params.householdId = householdName(params.householdId);
  if (params.shelterId) params.shelterId = shelterName(params.shelterId);
  if (params.severity) params.severity = statusName(params.severity);
  if (params.category) params.category = statusName(params.category);
  return copy(entry.messageKey, params);
}

function renderPhone() {
  const container = element('phone-content');
  const savedFocus = container.contains(document.activeElement) ? document.activeElement.id : '';
  const recipient = state.recipients.find(item => item.id === phoneHousehold) ?? state.recipients[0];
  const phoneTop = `<div class="phone-top"><span>${copy('ui.simulation')}</span><span class="phone-notch" aria-hidden="true"></span>
    <time datetime="${timeline[state.tick].time}">${timeAt(state.tick)}</time></div>`;
  if (!recipient) {
    container.innerHTML = `<div class="phone-device">${phoneTop}<div class="phone-message phone-idle">
      ${icon('notify')}<p>${copy('phone.empty')}</p></div></div>`;
    return;
  }
  phoneHousehold = recipient.id;
  const message = householdMessages(state, recipient)[phoneView];
  const options = state.recipients.map(item =>
    `<option value="${esc(item.id)}"${item.id === phoneHousehold ? ' selected' : ''}>${esc(householdName(item.id))}</option>`).join('');
  const choices = [['alert', 'phone.alert'], ['voice', 'phone.voiceScript']].map(([value, label]) =>
    `<option value="${value}"${value === phoneView ? ' selected' : ''}>${copy(label)}</option>`).join('');
  const channel = message?.channel === 'Voice call'
    ? `<p class="phone-call-label">${icon('phone')}${copy('phone.callScreen')}</p><p class="meta">${timeAt(message.tick)}</p>`
    : message ? `<p class="meta">${esc(channelName(message.channel))} · ${timeAt(message.tick)}</p>` : '';
  const body = message ? `<p class="phone-bubble" lang="bn">${esc(message.text)}</p>`
    : empty(copy('phone.noMessage'));
  const play = message?.channel === 'Voice call'
    ? action('voice', message.id, copy('messages.playBangla')) : '';
  container.innerHTML = `<div class="phone-device">
    ${phoneTop}
    <div class="phone-controls">
      <div class="phone-field"><label for="phone-household">${copy('phone.household')}</label><select id="phone-household">${options}</select></div>
      <div class="phone-field"><label for="phone-channel">${copy('phone.view')}</label><select id="phone-channel">${choices}</select></div>
    </div>
    <div class="phone-message">${channel}${body}${play}</div>
    <div class="phone-actions">
      <button type="button" id="phone-safe" class="button primary" data-action="phone-reply" data-id="safe" aria-label="${copy('phone.safe')}"><span lang="bn">${copy('phone.keySafe')}</span></button>
      <button type="button" id="phone-help" class="button secondary" data-action="phone-reply" data-id="help" aria-label="${copy('phone.help')}"><span lang="bn">${copy('phone.keyHelp')}</span></button>
      ${recipient.id === 'jamal' ? `<button type="button" id="phone-rescue" class="button secondary" data-action="phone-reply" data-id="rescue">${copy('phone.rescueSample')}</button>` : ''}
    </div>
  </div>`;
  if (savedFocus) element(savedFocus)?.focus({ preventScroll: true });
}

function renderGuide() {
  const current = guideStep(state);
  const viewed = guidePreview ?? current.step;
  const key = viewed === 7 ? 'guide.complete' : `guide.step${viewed}`;
  element('guide-step').textContent = translate('guide.step', { step: number(Math.min(viewed, 6)), total: number(6) });
  element('guide-title').textContent = translate(`${key}.title`);
  element('guide-detail').textContent = translate(`${key}.detail`);
  const needsRestart = Boolean(current.restart && guidePreview === null);
  element('guide-back').disabled = viewed === 1;
  element('guide-next').textContent = translate(viewed === 7 ? 'guide.reviewCases' : 'guide.next');
  element('guide-next').hidden = needsRestart;
  element('guide-restart').hidden = !needsRestart;
  element('guide-feedback').textContent = needsRestart ? translate('guide.skipToStart') : '';
}

function clearSpotlight() {
  guidedControl?.removeAttribute('data-guide-highlight');
  guidedControl = null;
  element('guide-spotlight').hidden = true;
  delete element('guide').dataset.dock;
}

function positionSpotlight() {
  const spotlight = element('guide-spotlight');
  if (!guidedControl?.isConnected || element('guide').hidden) {
    clearSpotlight();
    return;
  }
  const target = guidedControl.getBoundingClientRect();
  spotlight.hidden = target.bottom < 8 || target.top > window.innerHeight - 8;
  const gap = 4;
  const left = Math.max(gap, target.left - gap);
  const top = Math.max(gap, target.top - gap);
  spotlight.style.setProperty('--target-left', `${left}px`);
  spotlight.style.setProperty('--target-top', `${top}px`);
  spotlight.style.setProperty('--target-width', `${Math.min(window.innerWidth - gap, target.right + gap) - left}px`);
  spotlight.style.setProperty('--target-height', `${Math.min(window.innerHeight - gap, target.bottom + gap) - top}px`);
  element('guide').dataset.dock = target.bottom > window.innerHeight / 2 ? 'top' : 'bottom';
}

function openGuide(opener) {
  if (opener) guideOpener = opener;
  guidePreview = null;
  clearSpotlight();
  element('guide').hidden = false;
  renderGuide();
  element(guideStep(state).restart ? 'guide-restart' : 'guide-next').focus({ preventScroll: true });
}

function closeGuide(restoreFocus = true) {
  clearSpotlight();
  element('guide').hidden = true;
  guidePreview = null;
  if (restoreFocus) (guideOpener ?? element('guide-launch')).focus();
}

function showGuideTarget() {
  const current = guideStep(state);
  if (guidePreview !== null) {
    guidePreview = guidePreview + 1 < current.step ? guidePreview + 1 : null;
    renderGuide();
    if (element('guide-next').hidden) element('guide-restart').focus();
    return;
  }
  if (current.household) {
    phoneHousehold = current.household;
    phoneView = 'alert';
    renderPhone();
  }
  const target = current.selector && document.querySelector(current.selector);
  if (!target) {
    element('guide-feedback').textContent = translate('guide.targetMissing');
    return;
  }
  clearSpotlight();
  if (current.step === 7) {
    closeGuide(false);
    target.tabIndex = -1;
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
    return;
  }
  guidedControl = target;
  target.setAttribute('data-guide-highlight', '');
  target.scrollIntoView({ block: 'center' });
  target.focus({ preventScroll: true });
  positionSpotlight();
}

function renderReview(incident, review) {
  if (review?.pending) return `<span role="status">${copy('case.aiWorking')}</span>`;
  const button = action('ai-review', incident.id, copy('case.aiReview'));
  if (!review) return button;
  const category = statusName(review.result.category);
  const result = review.result.source === 'ai' ? copy('case.aiResult', { category, reason: review.result.reason })
    : copy('case.aiFallback', { category });
  return `${button}<p class="meta" role="status">${result}</p>`;
}

function drawChart(progress = 1) {
  const index = Number(river.value);
  const area = areas[index];
  const { width, height } = chart.getBoundingClientRect();
  if (!width || !height) return;
  const styles = getComputedStyle(document.documentElement);
  const color = name => styles.getPropertyValue(`--chart-${name}`).trim();
  const ratio = window.devicePixelRatio || 1;
  chart.width = Math.round(width * ratio);
  chart.height = Math.round(height * ratio);
  const ctx = chart.getContext('2d');
  ctx.scale(ratio, ratio);

  const bottom = height - 25;
  const top = 15;
  const left = 36;
  const right = width - 26;
  const levels = timeline.slice(0, state.tick + 1).map(entry => entry.readings[index][0]);
  const low = Math.floor(Math.min(...levels, area.threshold) - 0.15);
  const high = Math.max(low + 2, Math.ceil(Math.max(...levels, area.threshold) + 0.1));
  const x = tick => left + (right - left) * tick / (timeline.length - 1);
  const y = level => bottom - (level - low) * (bottom - top) / (high - low);
  chart.setAttribute('aria-label', translate('river.chartDescription', {
    area: areaName(area.id),
    threshold: number(area.threshold),
    readings: levels.map((level, tick) => translate('river.chartReading', {
      time: timeAt(tick), level: number(level),
    })).join(', '),
  }));

  ctx.font = '12px Inter, "Noto Sans Bengali", "Nirmala UI", "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let value = low; value <= high; value += (high - low) / 4) {
    ctx.fillStyle = color('label');
    ctx.fillText(number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), left - 8, y(value));
    ctx.strokeStyle = color('grid');
    ctx.beginPath();
    ctx.moveTo(left, y(value));
    ctx.lineTo(right, y(value));
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  timeline.forEach((entry, tick) => {
    ctx.fillStyle = color('label');
    ctx.fillText(formatTime(language, entry.time), x(tick), height - 8);
  });

  ctx.strokeStyle = color('threshold');
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(left, y(area.threshold));
  ctx.lineTo(right, y(area.threshold));
  ctx.stroke();
  ctx.setLineDash([]);
  const thresholdLabel = translate('river.thresholdShort');
  ctx.textAlign = 'right';
  const tagWidth = ctx.measureText(thresholdLabel).width + 10;
  const thresholdY = y(area.threshold);
  ctx.fillStyle = styles.getPropertyValue('--surface-tint').trim();
  ctx.fillRect(right - tagWidth, thresholdY - 9, tagWidth, 18);
  ctx.fillStyle = color('threshold');
  ctx.fillText(thresholdLabel, right - 4, thresholdY);

  chartPoints = levels.map((level, tick) => ({ x: x(tick), y: y(level), level, tick }));
  const points = chartPoints.map(point => [point.x, point.y]);
  if (points.length > 1 && progress < 1) {
    const previous = points.at(-2);
    const last = points.at(-1);
    points[points.length - 1] = previous.map((coordinate, axis) => coordinate + (last[axis] - coordinate) * progress);
  }
  if (points.length > 1) {
    const gradient = ctx.createLinearGradient(0, top, 0, bottom);
    gradient.addColorStop(0, color('fill-top'));
    gradient.addColorStop(1, color('fill-bottom'));
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(...points[0]);
    traceReadings(ctx, points);
    ctx.lineTo(points.at(-1)[0], bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  ctx.strokeStyle = color('line');
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  traceReadings(ctx, points);
  ctx.stroke();
  ctx.fillStyle = color('line');
  points.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  updateChartTooltip();
}

function traceReadings(ctx, points) {
  for (let index = 1; index < points.length; index++) {
    const [x, y] = points[index];
    const [lastX, lastY] = points[index - 1];
    const middle = (x + lastX) / 2;
    ctx.bezierCurveTo(middle, lastY, middle, y, x, y);
  }
}

function updateChartTooltip(announce = false) {
  const tooltip = element('chart-tooltip');
  const point = chartPoints[chartIndex];
  tooltip.hidden = !point;
  if (!point) return;
  const label = translate('river.chartReading', { time: timeAt(point.tick), level: decimal(point.level) });
  tooltip.textContent = label;
  const left = Math.max(6, Math.min(point.x + 8, chartSurface.clientWidth - tooltip.offsetWidth - 6));
  const top = Math.max(4, point.y - tooltip.offsetHeight - 8);
  tooltip.style.inset = `${top}px auto auto ${left}px`;
  if (announce) element('chart-announcement').textContent = label;
}

function commit(message, source, replayAdvanced = false) {
  const byGuide = source && source === guidedControl;
  const shouldAnimateApproval = source?.dataset.action === 'approve';
  clearSpotlight();
  try {
    preferences?.setItem(storageKey, JSON.stringify(state));
  } catch {
    // State remains available in the current page.
  }
  render(replayAdvanced, true);
  if (shouldAnimateApproval) animateApproval();
  element('feedback').textContent = message;
  if (byGuide) {
    element(guideStep(state).restart ? 'guide-restart' : 'guide-next').focus({ preventScroll: true });
    return;
  }
  if (source && !source.isConnected) {
    const replacement = [...document.querySelectorAll('[data-action]')]
      .find(button => button.dataset.action === source.dataset.action && button.dataset.id === source.dataset.id);
    const focusTarget = replacement ?? (source.dataset.action === 'resolve' ? element('triage') : element('alerts'));
    if (!replacement) focusTarget.tabIndex = -1;
    focusTarget.focus({ preventScroll: true });
  } else if (source?.disabled) {
    element(element('guide').hidden ? 'guide-launch' : 'guide-next').focus({ preventScroll: true });
  }
}

element('advance').addEventListener('click', event => {
  if (advance(state)) commit(translate('feedback.advanced', { time: timeAt(state.tick) }), event.currentTarget, true);
});

function resetReplay() {
  if (!window.confirm(translate('hero.resetConfirm'))) return;
  window.speechSynthesis?.cancel();
  state = initialState();
  aiReviews.clear();
  shownMessages.clear();
  guidePreview = null;
  chartIndex = null;
  phoneHousehold = '';
  phoneView = 'alert';
  river.value = '0';
  element('reply-text').value = '';
  element('reply-text').setCustomValidity('');
  commit(translate('feedback.reset'));
  window.scrollTo(0, 0);
  if (!element('guide').hidden) element('guide-next').focus({ preventScroll: true });
}

element('reset').addEventListener('click', resetReplay);
element('guide-restart').addEventListener('click', resetReplay);
element('guide-next').addEventListener('click', showGuideTarget);
element('guide-back').addEventListener('click', () => {
  clearSpotlight();
  guidePreview = Math.max(1, (guidePreview ?? guideStep(state).step) - 1);
  renderGuide();
  if (element('guide-back').disabled) element('guide-next').focus();
});
element('guide-skip').addEventListener('click', () => closeGuide());
document.querySelectorAll('[data-guide-open]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  openGuide(link);
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !element('guide').hidden) closeGuide();
});
document.addEventListener('focusin', event => {
  if (guidedControl && event.target !== guidedControl) clearSpotlight();
});
window.addEventListener('scroll', () => { if (guidedControl) positionSpotlight(); }, { passive: true });
window.addEventListener('resize', () => { if (guidedControl) positionSpotlight(); });

function inspectPointer(event) {
  if (!chartPoints.length) return;
  const x = event.clientX - chart.getBoundingClientRect().left;
  const nearest = chartPoints.reduce((best, point) => Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best);
  chartIndex = nearest.tick;
  updateChartTooltip();
}
chartSurface.addEventListener('pointermove', event => { if (event.pointerType !== 'touch') inspectPointer(event); });
chartSurface.addEventListener('pointerdown', inspectPointer);
chartSurface.addEventListener('pointerleave', () => {
  if (document.activeElement === chartSurface) return;
  chartIndex = null;
  updateChartTooltip();
});
chartSurface.addEventListener('focus', () => {
  chartIndex ??= 0;
  updateChartTooltip(true);
});
chartSurface.addEventListener('blur', () => {
  chartIndex = null;
  updateChartTooltip();
});
chartSurface.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const last = chartPoints.length - 1;
  if (event.key === 'Home') chartIndex = 0;
  else if (event.key === 'End') chartIndex = last;
  else chartIndex = Math.max(0, Math.min(last, (chartIndex ?? 0) + (event.key === 'ArrowRight' ? 1 : -1)));
  updateChartTooltip(true);
});

element('phone-content').addEventListener('change', event => {
  if (event.target.id === 'phone-household') phoneHousehold = event.target.value;
  if (event.target.id === 'phone-channel') phoneView = event.target.value;
  renderPhone();
});

element('reply-form').addEventListener('submit', event => {
  event.preventDefault();
  const reply = element('reply-text');
  if (!receiveReply(state, element('household').value, reply.value)) {
    reply.reportValidity();
    return;
  }
  reply.value = '';
  commit(translate('feedback.reply'));
});

element('reply-text').addEventListener('input', event => {
  const input = event.target;
  input.setCustomValidity(input.value && !input.value.trim() ? translate('feedback.enterReply') : '');
});

document.querySelector('main').addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action: name, id } = button.dataset;
  switch (name) {
    case 'approve':
    case 'reject':
      if (decideAlert(state, id, name === 'approve')) commit(translate(name === 'approve' ? 'feedback.approved' : 'feedback.rejected'), button);
      break;
    case 'shelter':
      if (toggleShelter(state, id)) commit(translate('feedback.shelter'), button);
      break;
    case 'resolve':
      if (resolveCase(state, Number(id))) commit(translate('feedback.closed'), button);
      break;
    case 'sample': {
      const input = element('reply-text');
      input.value = id;
      input.setCustomValidity('');
      input.focus();
      break;
    }
    case 'voice':
      playVoice(Number(id), button);
      break;
    case 'phone-reply': {
      const reply = phoneReply(id);
      if (reply && receiveReply(state, phoneHousehold, reply)) commit(translate('phone.replySent'), button);
      break;
    }
    case 'ai-review':
      requestReview(Number(id), button);
      break;
  }
});

function playVoice(id, button) {
  const message = state.outbox.find(item => item.id === id);
  const speech = window.speechSynthesis;
  const voice = speech?.getVoices().find(voice => voice.localService && /^bn(?:-|_|$)/i.test(voice.lang));
  if (!message || !voice) {
    button.textContent = translate('messages.voiceUnavailable');
    element('feedback').textContent = translate('messages.voiceFallback');
    return;
  }
  speech.cancel();
  const narration = new SpeechSynthesisUtterance(message.text);
  narration.voice = voice;
  narration.lang = voice.lang;
  speech.speak(narration);
}

async function requestReview(id, button) {
  const incident = state.cases.find(item => item.id === id && !item.resolved);
  if (!aiEnabled || !incident || !window.confirm(translate('case.aiConfirm'))) return;
  const locale = language;
  const attempt = { text: incident.text, locale, pending: true };
  aiReviews.set(id, attempt);
  button.disabled = true;
  button.textContent = translate('case.aiWorking');
  element('feedback').textContent = button.textContent;
  let result = { category: incident.category, source: 'rules' };
  try {
    const response = await fetch('/api/triage-review', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: attempt.text, locale }),
    });
    if (response.ok) result = await response.json();
  } catch {
    // The case already contains the local rules result.
  }
  if (aiReviews.get(id) !== attempt) return;
  aiReviews.set(id, { text: attempt.text, locale, result });
  renderReplies();
  if (document.activeElement === document.body) {
    document.querySelector(`[data-action="ai-review"][data-id="${id}"]`)?.focus({ preventScroll: true });
  }
}

const sections = [...element('console-nav').querySelectorAll('a')];
const sectionJump = element('section-jump');
function renderSectionJump() {
  sectionJump.replaceChildren(...sections.map(link => {
    const option = document.createElement('option');
    option.value = link.hash;
    option.textContent = link.querySelector('[data-i18n]').textContent;
    return option;
  }));
  highlightSection();
}
sectionJump.addEventListener('change', () => {
  window.location.hash = sectionJump.value;
});

function highlightSection() {
  const location = window.location.hash || '#overview';
  sectionJump.value = sections.some(link => link.hash === location) ? location : '';
}

for (const link of sections) {
  const section = document.querySelector(link.hash);
  section.tabIndex = -1;
  link.addEventListener('click', () => requestAnimationFrame(() => section.focus({ preventScroll: true })));
}

function placePhone() {
  const panel = element('phone');
  const slot = element(phoneBreakpoint.matches ? 'phone-mobile-slot' : 'phone-desktop-slot');
  if (panel.parentElement === slot) return;
  const focus = panel.contains(document.activeElement) ? document.activeElement : null;
  slot.append(panel);
  focus?.focus({ preventScroll: true });
}

window.addEventListener('hashchange', highlightSection);
phoneBreakpoint.addEventListener('change', placePhone);
placePhone();

const themeSelect = element('theme-select');
function applyTheme(theme) {
  const value = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = value;
  themeSelect.value = value;
  drawChart();
}
themeSelect.addEventListener('change', () => {
  applyTheme(themeSelect.value);
  try { preferences?.setItem('sotorko-theme', themeSelect.value); } catch { /* This session retains the theme. */ }
});

const languageSelect = element('language-select');
function applyLanguage(value) {
  language = value === 'bn' ? 'bn' : 'en';
  languageSelect.value = language;
  translateStatic(document, language);
  renderSectionJump();
  const input = element('reply-text');
  input.setCustomValidity(input.value && !input.value.trim() ? translate('feedback.enterReply') : '');
  render();
}
languageSelect.addEventListener('change', () => {
  writeLanguage(preferences, languageSelect.value);
  applyLanguage(languageSelect.value);
});

applyLanguage(language);
try { applyTheme(preferences?.getItem('sotorko-theme')); } catch { applyTheme('light'); }
if (window.location.hash === '#guide') openGuide();
