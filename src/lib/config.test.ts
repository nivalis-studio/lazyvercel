import { afterEach, expect, test } from 'bun:test';
import { checkToken } from './config';

// Never call CONFIG.init/reload/save here: they touch ~/.config/lazyvercel.
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR = 500;

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const stubStatus = (status: number) => {
  globalThis.fetch = (async () =>
    new Response(null, { status })) as unknown as typeof fetch;
};

test('checkToken returns valid on 200 and sends the bearer token', async () => {
  let seenUrl = '';
  let seenAuth = null as string | null;
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    seenUrl = url;
    seenAuth = new Headers(init?.headers).get('Authorization');
    return Promise.resolve(new Response('{}', { status: 200 }));
  }) as unknown as typeof fetch;

  expect(await checkToken('test-token')).toBe('valid');
  expect(seenUrl).toBe('https://api.vercel.com/v2/user');
  expect(seenAuth).toBe('Bearer test-token');
});

test('checkToken returns invalid on 401 and 403', async () => {
  stubStatus(HTTP_UNAUTHORIZED);
  expect(await checkToken('test-token')).toBe('invalid');
  stubStatus(HTTP_FORBIDDEN);
  expect(await checkToken('test-token')).toBe('invalid');
});

test('checkToken returns unreachable on 5xx and 429', async () => {
  stubStatus(HTTP_SERVER_ERROR);
  expect(await checkToken('test-token')).toBe('unreachable');
  stubStatus(HTTP_TOO_MANY_REQUESTS);
  expect(await checkToken('test-token')).toBe('unreachable');
});

test('checkToken returns unreachable when fetch throws', async () => {
  globalThis.fetch = (() =>
    Promise.reject(
      new TypeError('Unable to connect'),
    )) as unknown as typeof fetch;
  expect(await checkToken('test-token')).toBe('unreachable');
});

test('checkToken returns unreachable on timeout', async () => {
  globalThis.fetch = ((_url: string, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('aborted', 'AbortError'));
      });
    })) as unknown as typeof fetch;
  expect(await checkToken('test-token', 10)).toBe('unreachable');
});
