import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { formatNumber, formatTime, readLanguage, t, translateStatic, translations, writeLanguage } from './i18n.js';

test('English and Bangla provide the same strings and template placeholders', () => {
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  assert.deepEqual(Object.keys(translations.en), Object.keys(translations.bn));
  for (const key of Object.keys(translations.en)) {
    const en = translations.en[key];
    const bn = translations.bn[key];
    assert.ok(en.trim() && bn.trim(), key);
    assert.equal(bn, bn.normalize('NFC'), key);
    assert.match(bn, /\p{Script=Bengali}/u, key);
    assert.deepEqual(placeholders(bn), placeholders(en), key);
  }
});

test('every translatable HTML string has an entry in both languages', async () => {
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g)].map(match => match[1]);
  assert.ok(keys.length > 35);
  for (const key of keys) {
    assert.ok(Object.hasOwn(translations.en, key), key);
    assert.ok(Object.hasOwn(translations.bn, key), key);
  }
});

test('translation formats labels without mutating semantic values or inserting HTML', () => {
  const measurements = { areaId: 'সিলেট', level: '৫.১৮', threshold: '৫' };
  const translated = t('bn', 'activity.alertRaised', measurements);
  assert.match(translated, /সিলেট/);
  assert.match(translated, /৫\.১৮ মিটার/);
  assert.doesNotMatch(translated, /\{\w+\}/);
  assert.equal(t('en', 'messages.voiceUnavailable'), 'Local Bangla voice unavailable');
  assert.equal(t('bn', 'status.No response'), 'উত্তর পাওয়া যায়নি');
  assert.equal(formatNumber('bn', 1234), '১,২৩৪');
  assert.equal(formatTime('bn', '08:45'), '০৮:৪৫');
  assert.equal(formatTime('en', '08:45'), '08:45');
  assert.equal(t('fr', 'phone.household'), translations.en['phone.household']);
  assert.equal(t('bn', 'nonexistent'), 'nonexistent');
});

test('language choice persists and storage failures leave an accessible English fallback', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key); },
    setItem(key, value) { values.set(key, value); },
  };
  assert.equal(readLanguage(storage), 'en');
  assert.equal(writeLanguage(storage, 'bn'), true);
  assert.equal(readLanguage(storage), 'bn');
  assert.equal(writeLanguage(storage, 'unknown'), false);
  assert.equal(readLanguage(storage), 'bn');
  assert.equal(writeLanguage(storage, 'en'), true);
  assert.equal(readLanguage(storage), 'en');
  const denied = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
  };
  assert.equal(readLanguage(denied), 'en');
  assert.equal(writeLanguage(denied, 'bn'), false);
});

test('static translation updates the document language, exposed labels, and visible text', () => {
  const attributes = { 'data-i18n': 'hero.title', 'data-i18n-aria': 'river.chart' };
  const node = {
    getAttribute(key) { return attributes[key]; },
    setAttribute(key, value) { attributes[key] = value; },
  };
  const document = {
    documentElement: { lang: 'en' },
    querySelectorAll(selector) { return attributes[selector.slice(1, -1)] ? [node] : []; },
  };
  translateStatic(document, 'bn');
  assert.equal(document.documentElement.lang, 'bn');
  assert.equal(node.textContent, translations.bn['hero.title']);
  assert.equal(attributes['aria-label'], translations.bn['river.chart']);
  translateStatic(document, 'en');
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(node.textContent, translations.en['hero.title']);
});
