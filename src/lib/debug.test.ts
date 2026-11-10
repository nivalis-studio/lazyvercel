import { afterEach, expect, spyOn, test } from 'bun:test';
import { createDebug } from './debug';

const originalDebug = process.env.DEBUG;

const setDebugEnv = (value: string | undefined) => {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, 'DEBUG');
    return;
  }
  process.env.DEBUG = value;
};

afterEach(() => {
  setDebugEnv(originalDebug);
});

const captureConsoleError = (fn: () => void) => {
  const spy = spyOn(console, 'error').mockImplementation(() => {
    /* silence */
  });
  try {
    fn();
    return [...spy.mock.calls];
  } finally {
    spy.mockRestore();
  }
};

const isEnabled = (debugEnv: string | undefined, namespace: string) => {
  setDebugEnv(debugEnv);
  return captureConsoleError(() => createDebug(namespace)('probe')).length > 0;
};

test('createDebug is a no-op when DEBUG is unset, empty or only separators', () => {
  expect(isEnabled(undefined, 'lazyvercel:stream')).toBe(false);
  expect(isEnabled('', 'lazyvercel:stream')).toBe(false);
  expect(isEnabled(' , ', 'lazyvercel:stream')).toBe(false);
});

test('createDebug writes the namespace and args to console.error', () => {
  setDebugEnv('*');
  const calls = captureConsoleError(() =>
    createDebug('lazyvercel:test')('hello', { a: 1 }),
  );

  expect(calls).toEqual([['[lazyvercel:test]', 'hello', { a: 1 }]]);
});

test('createDebug: * enables every namespace', () => {
  expect(isEnabled('*', 'lazyvercel:stream')).toBe(true);
  expect(isEnabled('*', 'anything')).toBe(true);
});

test('createDebug: a trailing * matches by plain prefix', () => {
  expect(isEnabled('lazyvercel*', 'lazyvercel:stream')).toBe(true);
  expect(isEnabled('lazyvercel*', 'lazyvercel')).toBe(true);
  expect(isEnabled('lazyvercel*', 'lazyvercelx')).toBe(true);
  expect(isEnabled('lazyvercel*', 'other')).toBe(false);
});

test('createDebug: ns:* matches children but not ns itself', () => {
  expect(isEnabled('lazyvercel:*', 'lazyvercel:stream')).toBe(true);
  expect(isEnabled('lazyvercel:*', 'lazyvercel')).toBe(false);
});

test('createDebug: a plain pattern matches itself and ns:child only', () => {
  expect(isEnabled('lazyvercel:stream', 'lazyvercel:stream')).toBe(true);
  expect(isEnabled('lazyvercel:stream', 'lazyvercel:stream:chunk')).toBe(true);
  expect(isEnabled('lazyvercel:stream', 'lazyvercel:streams')).toBe(false);
  expect(isEnabled('lazyvercel:stream', 'lazyvercel')).toBe(false);
});

test('createDebug: comma-separated lists are trimmed and any match enables', () => {
  const env = ' other , lazyvercel:deployments ';

  expect(isEnabled(env, 'lazyvercel:deployments')).toBe(true);
  expect(isEnabled(env, 'other')).toBe(true);
  expect(isEnabled(env, 'lazyvercel:stream')).toBe(false);
});

test('createDebug reads DEBUG once, when the logger is created', () => {
  setDebugEnv('*');
  const enabledLog = createDebug('lazyvercel:test');
  setDebugEnv(undefined);
  expect(captureConsoleError(() => enabledLog('x'))).toHaveLength(1);

  const disabledLog = createDebug('lazyvercel:test');
  setDebugEnv('*');
  expect(captureConsoleError(() => disabledLog('x'))).toHaveLength(0);
});
