import { expect, test } from 'bun:test';
import { formatLogTimestamp, parseLogEvents } from './log-events';

const FIRST_CREATED = 1000;

test('parseLogEvents keeps valid events in order and drops malformed ones', () => {
  const input = [
    { created: FIRST_CREATED, text: 'first', type: 'stdout' },
    { created: 2000, type: 'stdout' },
    { created: 3000, text: 'second', type: 'stderr', level: 'error' },
    { created: 4000, text: 'bad level', type: 'stdout', level: 'info' },
    { created: '5000', text: 'string created', type: 'stdout' },
    null,
    {
      created: 6000,
      text: 'third',
      type: 'stdout',
      level: 'warning',
      extra: 1,
    },
  ];

  expect(parseLogEvents(input).map(e => e.text)).toEqual([
    'first',
    'second',
    'third',
  ]);
  expect(parseLogEvents(input)[0]?.created).toEqual(new Date(FIRST_CREATED));
});

test('parseLogEvents returns an empty array for an empty array', () => {
  expect(parseLogEvents([])).toEqual([]);
});

test('parseLogEvents throws a clear error for a non-array body', () => {
  expect(() => parseLogEvents({ error: 'x' })).toThrow('expected an array');
  expect(() => parseLogEvents(null)).toThrow('expected an array');
});

test('parseLogEvents assigns a distinct id to each event', () => {
  const events = parseLogEvents([
    { created: FIRST_CREATED, text: 'a', type: 'stdout' },
    { created: FIRST_CREATED, text: 'a', type: 'stdout' },
  ]);

  expect(events).toHaveLength(2);
  expect(events[0]?.id).not.toBe(events[1]?.id);
  expect(events[0]?.id).toBeGreaterThan(0);
});

test('formatLogTimestamp matches fr-FR hour minute second', () => {
  const created = new Date('2026-11-11T21:24:01Z');
  expect(formatLogTimestamp(created)).toBe(
    created.toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  );
});
