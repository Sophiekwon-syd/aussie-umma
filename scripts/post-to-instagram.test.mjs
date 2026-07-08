import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brandEnvKey, resolveBrandSecrets, formatCta } from './post-to-instagram.helpers.mjs';

test('brandEnvKey uppercases and replaces hyphens', () => {
  assert.equal(brandEnvKey('nappyprice'), 'NAPPYPRICE');
  assert.equal(brandEnvKey('aussie-umma'), 'AUSSIE_UMMA');
});

test('resolveBrandSecrets prefers brand-suffixed vars', () => {
  const env = {
    IG_ACCESS_TOKEN_NAPPYPRICE: 'brandtok',
    IG_USER_ID_NAPPYPRICE: 'branduid',
    IG_ACCESS_TOKEN: 'fallbacktok',
    IG_USER_ID: 'fallbackuid',
  };
  assert.deepEqual(resolveBrandSecrets('nappyprice', env), { token: 'brandtok', userId: 'branduid' });
});

test('resolveBrandSecrets falls back to unsuffixed vars', () => {
  const env = { IG_ACCESS_TOKEN: 'fallbacktok', IG_USER_ID: 'fallbackuid' };
  assert.deepEqual(resolveBrandSecrets('nappyprice', env), { token: 'fallbacktok', userId: 'fallbackuid' });
});

test('formatCta handles object and string', () => {
  assert.equal(formatCta({ en: 'Save this →', ko: '저장하기' }), 'Save this →\n저장하기');
  assert.equal(formatCta('저장하기 →'), '저장하기 →');
  assert.equal(formatCta(undefined), '');
});
