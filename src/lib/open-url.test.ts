import { expect, test } from 'bun:test';
import { toBrowserUrl } from './open-url';

test('toBrowserUrl prefixes bare hosts with https', () => {
  expect(toBrowserUrl('my-app-abc123.vercel.app')).toBe(
    'https://my-app-abc123.vercel.app',
  );
});

test('toBrowserUrl keeps urls that already have a scheme', () => {
  expect(toBrowserUrl('https://vercel.com/team/app')).toBe(
    'https://vercel.com/team/app',
  );
  expect(toBrowserUrl('http://localhost:3000')).toBe('http://localhost:3000');
});
