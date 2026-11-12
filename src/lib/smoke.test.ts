import { afterEach, expect, test } from 'bun:test';
import { isSmokeRun, SMOKE_ENV_VAR, SMOKE_OK_LINE } from './smoke';

const original = process.env[SMOKE_ENV_VAR];

afterEach(() => {
  if (original === undefined) {
    delete process.env[SMOKE_ENV_VAR];
    return;
  }
  process.env[SMOKE_ENV_VAR] = original;
});

test('isSmokeRun is true only for the exact smoke value', () => {
  delete process.env[SMOKE_ENV_VAR];
  expect(isSmokeRun()).toBe(false);

  process.env[SMOKE_ENV_VAR] = '1';
  expect(isSmokeRun()).toBe(true);

  process.env[SMOKE_ENV_VAR] = 'true';
  expect(isSmokeRun()).toBe(false);
});

test('smoke sentinel stays a single line', () => {
  expect(SMOKE_OK_LINE.includes('\n')).toBe(false);
  expect(SMOKE_OK_LINE.length).toBeGreaterThan(0);
});
