/** biome-ignore-all lint/style/noMagicNumbers: fixture sizes */
import { expect, test } from 'bun:test';
import {
  appendCappedLogs,
  capLogs,
  MAX_LOG_LINES,
  omittedLogNotice,
} from './log-buffer';
import { parseLogEvents } from './log-events';

const SMALL_CAP = 4;

test('capLogs keeps a short list intact', () => {
  const logs = ['a', 'b'];
  expect(capLogs(logs, SMALL_CAP)).toEqual({ logs, droppedCount: 0 });
});

test('capLogs drops the oldest lines past the cap', () => {
  const capped = capLogs(['a', 'b', 'c', 'd', 'e'], SMALL_CAP);
  expect(capped.logs).toEqual(['b', 'c', 'd', 'e']);
  expect(capped.droppedCount).toBe(1);
});

test('the log array never exceeds the default cap', () => {
  const extra = 25;
  const lines = Array.from(
    { length: MAX_LOG_LINES + extra },
    (_, index) => index,
  );
  const capped = capLogs(lines);

  expect(capped.logs).toHaveLength(MAX_LOG_LINES);
  expect(capped.logs[0]).toBe(extra);
  expect(capped.logs.at(-1)).toBe(MAX_LOG_LINES + extra - 1);
  expect(capped.droppedCount).toBe(extra);
});

test('appendCappedLogs keeps existing line identity under the cap', () => {
  const first = { id: 1 };
  const previous = [first];
  const next = appendCappedLogs(previous, [{ id: 2 }], 0, SMALL_CAP);

  expect(next.droppedCount).toBe(0);
  expect(next.logs[0]).toBe(first);
  expect(next.logs[1]).toEqual({ id: 2 });
});

test('appendCappedLogs drops the oldest lines and counts them', () => {
  const kept = { id: 2 };
  const previous = [{ id: 1 }, kept];
  const alreadyDropped = 4;
  const cap = 2;
  const next = appendCappedLogs(previous, [{ id: 3 }], alreadyDropped, cap);

  expect(next.logs).toEqual([kept, { id: 3 }]);
  expect(next.logs[0]).toBe(kept);
  expect(next.droppedCount).toBe(5);
});

test('appendCappedLogs drops a whole previous buffer when the batch is longer', () => {
  const next = appendCappedLogs([1, 2, 3], [4, 5, 6, 7], 1, 3);
  expect(next.logs).toEqual([5, 6, 7]);
  expect(next.droppedCount).toBe(5);
});

test('flushing more than the cap drops the oldest lines', () => {
  const batchSize = 10;
  const total = MAX_LOG_LINES + 40;
  let logs: Array<number> = [];
  let droppedCount = 0;

  for (let start = 0; start < total; start += batchSize) {
    const batch = Array.from(
      { length: batchSize },
      (_, offset) => start + offset,
    );
    const next = appendCappedLogs(logs, batch, droppedCount);
    logs = next.logs;
    droppedCount = next.droppedCount;
    expect(logs.length).toBeLessThanOrEqual(MAX_LOG_LINES);
  }

  expect(logs).toHaveLength(MAX_LOG_LINES);
  expect(logs[0]).toBe(total - MAX_LOG_LINES);
  expect(logs.at(-1)).toBe(total - 1);
  expect(droppedCount).toBe(total - MAX_LOG_LINES);
});

test('an empty batch does not copy the buffer', () => {
  const previous = [1, 2];
  const next = appendCappedLogs(previous, [], 3, SMALL_CAP);
  expect(next.logs).toBe(previous);
  expect(next.droppedCount).toBe(3);
});

test('parsed events over the cap keep the newest lines and their ids', () => {
  const events = parseLogEvents(
    Array.from({ length: 10 }, (_, index) => ({
      created: index,
      text: `line-${index}`,
      type: 'stdout',
    })),
  );
  const capped = capLogs(events, 3);

  expect(capped.droppedCount).toBe(7);
  expect(capped.logs.map(event => event.text)).toEqual([
    'line-7',
    'line-8',
    'line-9',
  ]);
  expect(capped.logs[0]).toBe(events[7]);
  expect(new Set(capped.logs.map(event => event.id)).size).toBe(3);
});

test('omittedLogNotice is empty until lines are dropped', () => {
  expect(omittedLogNotice(0)).toBeNull();
  expect(omittedLogNotice(-1)).toBeNull();
});

test('omittedLogNotice names the cap and how many lines were dropped', () => {
  expect(omittedLogNotice(12)).toBe(
    'Showing the last 5,000 lines (12 earlier omitted)',
  );
});
