import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewReply } from './llm.js';

test('optional review defaults to the existing classifier and falls back on provider errors', async () => {
  const text = 'আমরা আটকে আছি, পাঁচ জন';
  const expected = { category: 'Rescue', source: 'rules' };
  assert.deepEqual(await reviewReply(text, 'bn'), expected);
  const fetcher = async () => { throw new Error('test timeout'); };
  assert.deepEqual(await reviewReply(text, 'bn', { apiKey: 'test', fetcher }), expected);
});

test('structured provider suggestions are separate from the workflow classification', async () => {
  let request;
  const fetcher = async (_, options) => {
    request = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        status: 'completed',
        output: [{ type: 'message', content: [{ type: 'output_text', text: '{"category":"Medical","reason":"আঘাতের কথা বলা হয়েছে।"}' }] }],
      }),
    };
  };
  const reply = 'আমার হাত আহত হয়েছে';
  assert.deepEqual(await reviewReply(reply, 'bn', { apiKey: 'test', fetcher }), {
    category: 'Medical', reason: 'আঘাতের কথা বলা হয়েছে।'.normalize('NFC'), source: 'ai',
  });
  assert.equal(request.store, false);
  assert.equal(request.input, reply.normalize('NFC'));
  assert.equal(request.text.format.strict, true);
});
