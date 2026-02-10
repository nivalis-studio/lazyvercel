import { afterEach, expect, test } from 'bun:test';
import { z } from 'zod';
import { getStreamObjects } from './stream';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

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
