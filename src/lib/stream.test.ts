import { afterEach, expect, test } from 'bun:test';
import { z } from 'zod';
import { getStreamObjects } from './stream';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const encoder = new TextEncoder();

const mockFetchChunks = (chunks: Array<string>, init?: ResponseInit) => {
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(
        new ReadableStream({
          start(controller) {
            for (const chunk of chunks) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          },
        }),
        init,
      ),
    )) as unknown as typeof fetch;
};

const collectIds = async () => {
  const out: Array<{ id: number }> = [];
  for await (const event of getStreamObjects({
    schema: z.object({ id: z.number() }),
    url: 'https://example.test',
  })) {
    out.push(event);
  }
  return out;
};

test('getStreamObjects parses trailing JSON object without newline terminator', async () => {
  const payload = '{"id":1}';

  globalThis.fetch = (async () =>
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(payload));
          controller.close();
        },
      }),
    )) as unknown as typeof fetch;

  const out: Array<{ id: number }> = [];
  for await (const event of getStreamObjects({
    schema: z.object({ id: z.number() }),
    url: 'https://example.test',
  })) {
    out.push(event);
  }

  expect(out).toEqual([{ id: 1 }]);
});

test('getStreamObjects yields every object of a multi-line chunk', async () => {
  mockFetchChunks(['{"id":1}\n{"id":2}\n{"id":3}\n']);
  expect(await collectIds()).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
});

test('getStreamObjects reassembles an object split across chunks', async () => {
  mockFetchChunks(['{"id":', '1}\n{"id"', ':2}']);
  expect(await collectIds()).toEqual([{ id: 1 }, { id: 2 }]);
});

test('getStreamObjects skips lines that are not valid JSON', async () => {
  mockFetchChunks(['{"id":1}\nnot json\n{"id":2}\n']);
  expect(await collectIds()).toEqual([{ id: 1 }, { id: 2 }]);
});

test('getStreamObjects skips lines that do not match the schema', async () => {
  mockFetchChunks(['{"id":"one"}\n{"name":"x"}\n{"id":2}\n']);
  expect(await collectIds()).toEqual([{ id: 2 }]);
});

test('getStreamObjects ignores blank lines, surrounding spaces and CRLF', async () => {
  mockFetchChunks(['\n   \n  {"id":1}  \r\n\n']);
  expect(await collectIds()).toEqual([{ id: 1 }]);
});

test('getStreamObjects drops an incomplete trailing object', async () => {
  mockFetchChunks(['{"id":1}\n{"id":']);
  expect(await collectIds()).toEqual([{ id: 1 }]);
});

test('getStreamObjects throws on a non-OK response', async () => {
  mockFetchChunks([], { status: 500 });
  await expect(collectIds()).rejects.toThrow('HTTP error! status: 500');
});
