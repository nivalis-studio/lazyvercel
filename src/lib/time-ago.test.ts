import { expect, test } from 'bun:test';
import { getTimeAgo } from './time-ago';

test('getTimeAgo (short) formats seconds', () => {
  const now = new Date('2020-01-01T00:00:10Z');
  const then = new Date('2020-01-01T00:00:00Z');

  expect(getTimeAgo(then, { dateToCompare: now, short: true })).toBe('10s');
});

test('getTimeAgo (long) formats minutes/hours with articles', () => {
  const now = new Date('2020-01-01T02:00:00Z');
  const oneHourAgo = new Date('2020-01-01T01:00:00Z');

  expect(getTimeAgo(oneHourAgo, { dateToCompare: now })).toBe('an hour ago');
});
