import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { THEMES_MAP } from './colors';
import { CONFIG, type Config, checkToken, setConfigDirectory } from './config';

// checkToken tests must not call CONFIG.init/reload/save: those touch
// ~/.config/lazyvercel. Save tests below redirect IO at a temp directory.
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

const OWNER_READ_WRITE = 0o644;
const OWNER_READ_ONLY = 0o444;

const countFetches = (): (() => number) => {
  let calls = 0;
  globalThis.fetch = (() => {
    calls += 1;
    return Promise.reject(new Error('offline'));
  }) as unknown as typeof fetch;
  return () => calls;
};

const errorCode = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return;
  }
  const { code } = error;
  return typeof code === 'string' ? code : undefined;
};

describe('CONFIG.save', () => {
  let directory = '';
  let snapshot: Config | null = null;
  let wasLoggedIn = false;

  const configFile = (): string => path.join(directory, 'config.json');

  beforeEach(() => {
    snapshot = null;
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lazyvercel-config-'));
    setConfigDirectory(directory);
    snapshot = { ...CONFIG.getUnchecked() };
    wasLoggedIn = CONFIG.isLoggedIn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    try {
      if (!(snapshot && directory)) {
        return;
      }
      try {
        fs.chmodSync(configFile(), OWNER_READ_WRITE);
      } catch {
        // The file is only present after a save.
      }
      setConfigDirectory(directory);
      CONFIG.save(snapshot, { loggedIn: wasLoggedIn });
    } finally {
      setConfigDirectory();
      if (directory) {
        fs.rmSync(directory, { recursive: true, force: true });
      }
      directory = '';
      snapshot = null;
    }
  });

  test('persists a theme in memory and on disk without a fetch', () => {
    const fetches = countFetches();
    CONFIG.save(
      { ...CONFIG.getUnchecked(), bearerToken: 'token' },
      { loggedIn: true },
    );

    CONFIG.save({ ...CONFIG.getUnchecked(), theme: 'nord' });

    expect(fetches()).toBe(0);
    expect(CONFIG.isLoggedIn()).toBe(true);
    expect(CONFIG.getUnchecked().theme).toBe('nord');
    expect(CONFIG.getTheme()).toBe(THEMES_MAP.nord);
    expect(CONFIG.get().bearerToken).toBe('token');

    const written = JSON.parse(fs.readFileSync(configFile(), 'utf8')) as {
      theme: string;
      bearerToken: string;
    };
    expect(written.theme).toBe('nord');
    expect(written.bearerToken).toBe('token');
  });

  test('records a known-valid token without checking it again', () => {
    const fetches = countFetches();

    CONFIG.save(
      { ...CONFIG.getUnchecked(), bearerToken: 'new-token' },
      { loggedIn: true },
    );

    expect(fetches()).toBe(0);
    expect(CONFIG.isLoggedIn()).toBe(true);
    expect(CONFIG.get().bearerToken).toBe('new-token');
  });

  test('leaves memory unchanged when the config file is read-only', () => {
    CONFIG.save(
      { ...CONFIG.getUnchecked(), bearerToken: 'token' },
      { loggedIn: true },
    );
    fs.chmodSync(configFile(), OWNER_READ_ONLY);

    const savedTheme = CONFIG.getUnchecked().theme;
    const fetches = countFetches();
    let thrown: unknown;
    try {
      CONFIG.save({ ...CONFIG.getUnchecked(), theme: 'dracula' });
    } catch (error) {
      thrown = error;
    }

    expect(errorCode(thrown)).toBe('EACCES');
    expect(fetches()).toBe(0);
    expect(CONFIG.isLoggedIn()).toBe(true);
    expect(CONFIG.getUnchecked().theme).toBe(savedTheme);
    const resolved =
      savedTheme === 'custom'
        ? CONFIG.getCustomTheme()
        : THEMES_MAP[savedTheme];
    expect(CONFIG.getTheme()).toBe(resolved);
  });
});
