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
  const oneMinuteAgo = new Date('2020-01-01T01:59:00Z');

  expect(getTimeAgo(oneHourAgo, { dateToCompare: now })).toBe('an hour ago');
  expect(getTimeAgo(oneMinuteAgo, { dateToCompare: now })).toBe('a minute ago');
});

const YEAR_2020 = 2020;
const NOW = Date.UTC(YEAR_2020, 0, 1);
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Multipliers for the tables below (named to satisfy noMagicNumbers).
const ONE_AND_A_HALF = 1.5;
const THREE = 3;
const FIVE = 5;
const SIX = 6;
const SEVEN = 7;
const FOURTEEN = 14;
const TWENTY_THREE = 23;
const TWENTY_NINE = 29;
const THIRTY = 30;
const FIFTY_NINE = 59;
const NINETY = 90;
const THREE_FIFTY_NINE = 359;
const THREE_SIXTY = 360;
const SEVEN_TWENTY = 720;

// Every difference here is >= 1 second on purpose: zero, negative and
// sub-second differences belong to plan 008.
const SHORT_CASES: Array<[string, number, string]> = [
  ['1 second', SECOND, '1s'],
  ['1.5 seconds (floored)', ONE_AND_A_HALF * SECOND, '1s'],
  ['59 seconds', FIFTY_NINE * SECOND, '59s'],
  ['60 seconds', MINUTE, '1m'],
  ['90 seconds', NINETY * SECOND, '1m'],
  ['59 minutes', FIFTY_NINE * MINUTE, '59m'],
  ['1 hour', HOUR, '1h'],
  ['23 hours', TWENTY_THREE * HOUR, '23h'],
  ['24 hours', DAY, '1d'],
  ['6 days', SIX * DAY, '6d'],
  ['7 days', SEVEN * DAY, '1w'],
  ['29 days', TWENTY_NINE * DAY, '4w'],
  ['30 days', THIRTY * DAY, '1M'],
  ['359 days', THREE_FIFTY_NINE * DAY, '11M'],
  ['360 days', THREE_SIXTY * DAY, '1y'],
  ['720 days', SEVEN_TWENTY * DAY, '2y'],
];

test.each(SHORT_CASES)('getTimeAgo (short) %s', (_label, diffMs, expected) => {
  expect(getTimeAgo(NOW - diffMs, { dateToCompare: NOW, short: true })).toBe(
    expected,
  );
});

const LONG_CASES: Array<[string, number, string]> = [
  ['1 second', SECOND, 'a second ago'],
  ['2 seconds', 2 * SECOND, '2 seconds ago'],
  ['1 minute', MINUTE, 'a minute ago'],
  ['5 minutes', FIVE * MINUTE, '5 minutes ago'],
  ['1 hour', HOUR, 'an hour ago'],
  ['3 hours', THREE * HOUR, '3 hours ago'],
  ['1 day', DAY, 'a day ago'],
  ['2 days', 2 * DAY, '2 days ago'],
  ['1 week', SEVEN * DAY, 'a week ago'],
  ['2 weeks', FOURTEEN * DAY, '2 weeks ago'],
  ['1 month', THIRTY * DAY, 'a month ago'],
  ['2 months', 60 * DAY, '2 months ago'],
  ['1 year', THREE_SIXTY * DAY, 'a year ago'],
  ['2 years', SEVEN_TWENTY * DAY, '2 years ago'],
];

test.each(LONG_CASES)('getTimeAgo (long) %s', (_label, diffMs, expected) => {
  expect(getTimeAgo(NOW - diffMs, { dateToCompare: NOW })).toBe(expected);
});

test('getTimeAgo accepts number, Date and ISO string inputs', () => {
  const then = NOW - 10 * SECOND;

  expect(getTimeAgo(then, { dateToCompare: NOW, short: true })).toBe('10s');
  expect(getTimeAgo(new Date(then), { dateToCompare: NOW, short: true })).toBe(
    '10s',
  );
  expect(
    getTimeAgo(new Date(then).toISOString(), {
      dateToCompare: NOW,
      short: true,
    }),
  ).toBe('10s');
  expect(
    getTimeAgo(then, {
      dateToCompare: new Date(NOW).toISOString(),
      short: true,
    }),
  ).toBe('10s');
});
