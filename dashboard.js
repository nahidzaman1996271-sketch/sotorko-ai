import {
  advance, areas, assess, decideAlert, initialState, receiveReply, resolveCase, shelterSpace, timeline, toggleShelter,
} from './simulation.js';
import { createBasinGraphic } from './basin.js';

const element = id => document.getElementById(id);
const storageKey = 'sotorko-demo-v2';
const chart = element('chart');
const river = element('river');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const basin = createBasinGraphic(element('basin-art'), element('motion-toggle'), motionPreference, areas);
let chartFrame = 0;
let state = initialState();

try {
  const saved = localStorage.getItem(storageKey);
  if (saved) state = JSON.parse(saved);
} catch {
  // The replay still works when browser storage is unavailable.
}

const esc = text => String(text).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const areaName = id => areas.find(area => area.id === id).name;
const timeAt = tick => timeline[tick].time;
const badge = label => `<span class="badge ${label.toLowerCase().replaceAll(' ', '-')}">${label}</span>`;
const empty = text => `<p class="empty">${text}</p>`;
const action = (name, id, label, primary = false) =>
  `<button class="button ${primary ? 'primary' : 'secondary'}" type="button" data-action="${name}" data-id="${id}">${label}</button>`;
const item = content => `<div class="stack-item">${content}</div>`;
const row = (heading, detail) => `<div class="row"><strong>${heading}</strong>${detail}</div>`;

river.innerHTML = areas.map((area, index) => `<option value="${index}">${area.name}</option>`).join('');
river.addEventListener('change', () => drawChart());
new ResizeObserver(() => drawChart()).observe(chart);

function render(replayAdvanced = false) {
  element('advance').disabled = state.tick === timeline.length - 1;
  element('advance').textContent = element('advance').disabled ? 'Replay complete' : 'Advance 15 min';
  const metrics = [
    ['Replay time (BST)', timeAt(state.tick), 'clock', '◷'],
    ['Awaiting approval', state.alerts.filter(alert => alert.status === 'pending').length, 'approval', '◇'],
    ['Simulated messages', state.outbox.length, 'messages', '▤'],
    ['Open triage cases', state.cases.filter(incident => !incident.resolved).length, 'cases', '✚'],
  ];
  element('summary').innerHTML = metrics.map(([label, value, tone, symbol]) =>
    `<dl class="metric ${tone}"><dt><span class="metric-icon" aria-hidden="true">${symbol}</span> ${label}</dt><dd>${value}</dd></dl>`).join('');

  const readings = areas.map((_, index) => assess(index, state.tick));
  element('areas').innerHTML = readings.map((reading, index) => {
    const area = areas[index];
    return `<div class="area ${reading.severity.toLowerCase()}">${row(area.name, badge(reading.severity))}
      <p class="meta">${area.river} · ${reading.level.toFixed(2)} m · ${reading.rain} mm rain</p>
      <div class="risk-scale"><progress max="100" value="${reading.score}" aria-label="${area.name} demo risk score"></progress>
      <span class="meta">Demo score ${reading.score}/100</span></div></div>`;
  }).join('');
  basin.update(readings.map(reading => reading.severity));

  element('approval-list').innerHTML = state.alerts.map(alert => {
    const status = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }[alert.status];
    const buttons = alert.status === 'pending'
      ? `<div class="form-actions">${action('approve', alert.area, 'Approve simulated alert', true)}${action('reject', alert.area, 'Reject')}</div>`
      : '';
    return item(`${row(areaName(alert.area), badge(status))}<p class="meta">Severe threshold crossed at ${timeAt(alert.tick)}.</p>${buttons}`);
  }).join('') || empty('No severe alerts. Advance the replay to simulate rising river levels.');

  element('shelter-list').innerHTML = state.shelters.map(shelter => {
    const spaces = shelterSpace(state, shelter);
    const buttonLabel = shelter.full ? 'Mark available' : 'Simulate full';
    return item(`${row(shelter.name, badge(`${spaces} places free`))}
      <progress max="${shelter.capacity}" value="${shelter.capacity - spaces}" aria-label="${shelter.name} places used"></progress>
      <div class="row"><p class="meta">${areaName(shelter.area)} · ${shelter.distance} km · ${shelter.capacity} total</p>
      ${action('shelter', shelter.id, buttonLabel)}</div>`);
  }).join('');

  renderReplies();
  element('message-list').innerHTML = state.outbox.map(message => item(
    `${row(message.recipient, badge(message.channel))}
      <p class="meta">${timeAt(message.tick)} · ${message.kind}</p>
      <p class="message" lang="bn">${message.text}</p>
      ${message.channel === 'Voice call' ? `<div class="form-actions">${action('voice', message.id, 'Play Bangla preview')}</div>` : ''}`,
  )).join('') || empty('Simulated messages appear after approval.');

  element('activity-list').innerHTML = state.activity.map(entry => item(
    `${row(entry.agent, `<time class="meta">${timeAt(entry.tick)}</time>`)}<p class="meta">${entry.message}</p>`,
  )).join('');

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

function renderReplies() {
  const hasRecipients = state.recipients.length > 0;
  element('reply-empty').hidden = hasRecipients;
  element('reply-form').hidden = !hasRecipients;
  const select = element('household');
  const previous = select.value;
  select.innerHTML = state.recipients.map(recipient =>
    `<option value="${recipient.id}">${recipient.name} · ${areaName(recipient.area)}</option>`).join('');
  if (state.recipients.some(recipient => recipient.id === previous)) select.value = previous;

  element('recipient-list').innerHTML = state.recipients.map(recipient => {
    const shelter = state.shelters.find(shelter => shelter.id === recipient.shelter);
    return item(`${row(recipient.name, badge(recipient.status))}
      <p class="meta">${recipient.channel} · ${shelter?.name ?? 'No shelter space assigned'}</p>`);
  }).join('');
  const openFirst = [...state.cases].sort((a, b) => Number(Boolean(a.resolved)) - Number(Boolean(b.resolved)));
  element('case-list').innerHTML = openFirst.map(incident => item(
    `${row(incident.name, badge(incident.resolved ? 'Closed' : incident.category))}
      <p class="meta">${timeAt(incident.tick)} · ${incident.people === null ? 'Group size unknown' : `${incident.people} people reported`}</p>
      <p class="message" dir="auto"${/\p{Script=Bengali}/u.test(incident.text) ? ' lang="bn"' : ''}>${esc(incident.text)}</p>
      ${incident.resolved ? '' : `<div class="form-actions">${action('resolve', incident.id, 'Close demo case')}</div>`}`,
  )).join('') || empty('Replies asking for help or needing review appear here.');
}

function drawChart(progress = 1) {
  const index = Number(river.value);
  const area = areas[index];
  const { width, height } = chart.getBoundingClientRect();
  if (!width || !height) return;
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
  const low = Math.floor(Math.min(levels[0], area.threshold) - 0.15);
  const high = Math.max(low + 2, Math.ceil(Math.max(...levels, area.threshold) + 0.1));
  const x = tick => left + (right - left) * tick / (timeline.length - 1);
  const y = level => bottom - (level - low) * (bottom - top) / (high - low);
  chart.setAttribute('aria-label', `${area.name} river levels. Demo threshold ${area.threshold} metres. ${levels.map((level, tick) => `${timeAt(tick)} at ${level} metres`).join(', ')}.`);

  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let value = low; value <= high; value += (high - low) / 4) {
    ctx.fillStyle = '#526761';
    ctx.fillText(value.toFixed(1), left - 8, y(value));
    ctx.strokeStyle = '#e4ede9';
    ctx.beginPath();
    ctx.moveTo(left, y(value));
    ctx.lineTo(right, y(value));
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  timeline.forEach((entry, tick) => {
    ctx.fillStyle = '#526761';
    ctx.fillText(entry.time, x(tick), height - 8);
  });

  ctx.strokeStyle = '#b86140';
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(left, y(area.threshold));
  ctx.lineTo(right, y(area.threshold));
  ctx.stroke();
  ctx.setLineDash([]);

  const points = levels.map((level, tick) => [x(tick), y(level)]);
  if (points.length > 1 && progress < 1) {
    const previous = points.at(-2);
    const last = points.at(-1);
    points[points.length - 1] = previous.map((coordinate, axis) => coordinate + (last[axis] - coordinate) * progress);
  }
  if (points.length > 1) {
    const gradient = ctx.createLinearGradient(0, top, 0, bottom);
    gradient.addColorStop(0, '#49bc9970');
    gradient.addColorStop(1, '#49bc9907');
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    points.forEach(([px, py]) => ctx.lineTo(px, py));
    ctx.lineTo(points.at(-1)[0], bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  ctx.strokeStyle = '#008466';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  points.slice(1).forEach(point => ctx.lineTo(...point));
  ctx.stroke();
  ctx.fillStyle = '#008466';
  points.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function commit(message, source, replayAdvanced = false) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // State remains available in the current page.
  }
  render(replayAdvanced);
  element('feedback').textContent = message;
  if (source && !source.isConnected) {
    const replacement = [...document.querySelectorAll('[data-action]')]
      .find(button => button.dataset.action === source.dataset.action && button.dataset.id === source.dataset.id);
    const focusTarget = replacement ?? (source.dataset.action === 'resolve' ? element('triage') : element('alerts'));
    if (!replacement) focusTarget.tabIndex = -1;
    focusTarget.focus({ preventScroll: true });
  }
}

element('advance').addEventListener('click', () => {
  if (advance(state)) commit(`Replay advanced to ${timeAt(state.tick)}.`, null, true);
});

element('reset').addEventListener('click', () => {
  if (!window.confirm('Reset all demo activity and return to 08:00?')) return;
  window.speechSynthesis?.cancel();
  state = initialState();
  river.value = '0';
  element('reply-text').value = '';
  element('reply-text').setCustomValidity('');
  commit('Demo reset.');
  window.scrollTo(0, 0);
});

element('reply-form').addEventListener('submit', event => {
  event.preventDefault();
  const reply = element('reply-text');
  if (!receiveReply(state, element('household').value, reply.value)) {
    reply.reportValidity();
    return;
  }
  reply.value = '';
  commit('Simulated reply received.');
});

element('reply-text').addEventListener('input', event => {
  const input = event.target;
  input.setCustomValidity(input.value && !input.value.trim() ? 'Enter a reply.' : '');
});

document.querySelector('main').addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action: name, id } = button.dataset;
  switch (name) {
    case 'approve':
    case 'reject':
      if (decideAlert(state, id, name === 'approve')) commit(`Alert ${name === 'approve' ? 'approved' : 'rejected'}.`, button);
      break;
    case 'shelter':
      if (toggleShelter(state, id)) commit('Shelter status updated.', button);
      break;
    case 'resolve':
      if (resolveCase(state, Number(id))) commit('Simulated case closed.', button);
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
  }
});

function playVoice(id, button) {
  const message = state.outbox.find(item => item.id === id);
  const speech = window.speechSynthesis;
  const voice = speech?.getVoices().find(voice => voice.localService && /^bn(?:-|_|$)/i.test(voice.lang));
  if (!message || !voice) {
    button.textContent = 'Local Bangla voice unavailable';
    element('feedback').textContent = 'This browser has no local Bangla speech voice. The Bangla call script is shown above.';
    return;
  }
  speech.cancel();
  const narration = new SpeechSynthesisUtterance(message.text);
  narration.voice = voice;
  narration.lang = voice.lang;
  speech.speak(narration);
}

const sections = [...element('console-nav').querySelectorAll('a')];
const sectionJump = element('section-jump');
for (const link of sections) {
  const option = document.createElement('option');
  option.value = link.hash;
  option.textContent = link.lastChild.textContent.trim();
  sectionJump.append(option);
}
sectionJump.addEventListener('change', () => {
  window.location.hash = sectionJump.value;
});

function highlightSection() {
  const location = window.location.hash || '#overview';
  sections.forEach(link => {
    if (link.hash === location) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  sectionJump.value = sections.some(link => link.hash === location) ? location : '#overview';
}

window.addEventListener('hashchange', highlightSection);
highlightSection();
render();
