import { expect, test } from 'bun:test';
import { isUnmodifiedKey } from './key-input';
import type { ShortcutKey } from './key-input';

const CASES: Array<[string, ShortcutKey, string, boolean]> = [
  ['j', { name: 'j' }, 'j', true],
  ['ctrl+j', { name: 'j', ctrl: true }, 'j', false],
  ['meta+j', { name: 'j', meta: true }, 'j', false],
  ['ctrl+meta+j', { name: 'j', ctrl: true, meta: true }, 'j', false],
  ['k', { name: 'k' }, 'k', true],
  ['ctrl+k', { name: 'k', ctrl: true }, 'k', false],
  ['meta+k', { name: 'k', meta: true }, 'k', false],
  ['r', { name: 'r' }, 'r', true],
  ['ctrl+r', { name: 'r', ctrl: true }, 'r', false],
  ['meta+r', { name: 'r', meta: true }, 'r', false],
  ['h', { name: 'h' }, 'h', true],
  ['ctrl+h', { name: 'h', ctrl: true }, 'h', false],
  ['l', { name: 'l' }, 'l', true],
  ['meta+l', { name: 'l', meta: true }, 'l', false],
  ['j is not k', { name: 'j' }, 'k', false],
  [
    'explicit false modifiers',
    { name: 'r', ctrl: false, meta: false },
    'r',
    true,
  ],
];

test.each(CASES)('isUnmodifiedKey %s', (_label, key, name, expected) => {
  expect(isUnmodifiedKey(key, name)).toBe(expected);
});
