import { afterEach, expect, test } from 'bun:test';
import { fetchProjectsWithToken, MAX_PROJECT_PAGES } from './projects';

const TOKEN = 'test-token-not-real';
const NEXT_CURSOR = 1_700_000_000_000;
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// Each call gets a fresh Response (a body can only be read once). After the
// list runs out, the last factory is reused.
const stubFetch = (responses: Array<() => Response>) => {
  const urls: Array<string> = [];
  globalThis.fetch = ((input: string | URL | Request) => {
    urls.push(String(input));
    const make = responses[Math.min(urls.length - 1, responses.length - 1)];
    if (!make) {
      return Promise.reject(new Error('no stubbed response'));
    }
    return Promise.resolve(make());
  }) as unknown as typeof fetch;
  return urls;
};

const page = (ids: Array<string>, next: number | string | null) => () =>
  Response.json({
    projects: ids.map(id => ({ id, name: id })),
    pagination: { count: ids.length, next, prev: null },
  });

test('concatenates pages in order and sends the cursor back as from', async () => {
  const urls = stubFetch([page(['a', 'b'], NEXT_CURSOR), page(['c'], null)]);

  const result = await fetchProjectsWithToken('team_1', TOKEN);

  expect(result.map(p => p.id)).toEqual(['a', 'b', 'c']);
  expect(urls).toHaveLength(2);
  expect(urls[0]).toContain('teamId=team_1');
  expect(urls[0]).not.toContain('from=');
  expect(urls[1]).toContain('from=1700000000000');
  expect(urls.join(' ')).not.toContain(TOKEN);
});

test('non-OK JSON error shows status and API message', async () => {
  stubFetch([
    () =>
      Response.json(
        { error: { code: 'forbidden', message: 'Not authorized' } },
        { status: 403 },
      ),
  ]);

  const err = await fetchProjectsWithToken('team_1', TOKEN).catch(
    (e: unknown) => e,
  );

  expect(err).toBeInstanceOf(Error);
  expect((err as Error).message).toBe(
    'Failed to fetch projects (HTTP 403): Not authorized',
  );
  expect((err as Error).cause).toBe('Not authorized');
  expect((err as Error).message).not.toContain(TOKEN);
});

test('non-OK non-JSON body shows status, not a SyntaxError', async () => {
  stubFetch([
    () =>
      new Response('<html>Bad Gateway</html>', {
        status: 502,
        headers: { 'content-type': 'text/html' },
      }),
  ]);

  const err = await fetchProjectsWithToken('team_1', TOKEN).catch(
    (e: unknown) => e,
  );

  expect(err).toBeInstanceOf(Error);
  expect(err).not.toBeInstanceOf(SyntaxError);
  expect((err as Error).message).toBe('Failed to fetch projects (HTTP 502)');
});

test('page cap stops an endless cursor', async () => {
  const urls = stubFetch([page(['x'], 'cursor-that-never-ends')]);

  const result = await fetchProjectsWithToken('team_1', TOKEN);

  expect(urls).toHaveLength(MAX_PROJECT_PAGES);
  expect(result).toHaveLength(MAX_PROJECT_PAGES);
});
