import { expect, test } from 'bun:test';
import {
  getBranch,
  getCommit,
  getCreatedAt,
  getStatusInfo,
} from './extract-deploy-details';
import type { Deployment } from '../types/vercel-sdk';
import type { Theme } from './colors';

type DeploymentFixture = {
  uid?: string;
  created?: number;
  createdAt?: number;
  meta?: Record<string, string>;
  readyState?: string;
  state?: string;
};

const makeDeployment = (fields: DeploymentFixture): Deployment =>
  ({ uid: 'dpl_test', created: 0, ...fields }) as unknown as Deployment;

const CREATED = 5;
const CREATED_AT = 10;

test('getCreatedAt prefers createdAt and falls back to created', () => {
  expect(
    getCreatedAt(makeDeployment({ created: CREATED, createdAt: CREATED_AT })),
  ).toBe(CREATED_AT);
  expect(getCreatedAt(makeDeployment({ created: CREATED }))).toBe(CREATED);
  // createdAt 0 is kept: the fallback uses ?? (nullish), not ||.
  expect(getCreatedAt(makeDeployment({ created: CREATED, createdAt: 0 }))).toBe(
    0,
  );
});

test('getBranch follows github > gitlab > bitbucket > commitRef > branch', () => {
  expect(
    getBranch(
      makeDeployment({
        meta: {
          githubCommitRef: 'gh',
          gitlabCommitRef: 'gl',
          bitbucketCommitRef: 'bb',
          commitRef: 'cr',
          branch: 'br',
        },
      }),
    ),
  ).toBe('gh');
  expect(
    getBranch(
      makeDeployment({
        meta: {
          gitlabCommitRef: 'gl',
          bitbucketCommitRef: 'bb',
          commitRef: 'cr',
          branch: 'br',
        },
      }),
    ),
  ).toBe('gl');
  expect(
    getBranch(
      makeDeployment({
        meta: { bitbucketCommitRef: 'bb', commitRef: 'cr', branch: 'br' },
      }),
    ),
  ).toBe('bb');
  expect(
    getBranch(makeDeployment({ meta: { commitRef: 'cr', branch: 'br' } })),
  ).toBe('cr');
  expect(getBranch(makeDeployment({ meta: { branch: 'br' } }))).toBe('br');
});

test('getBranch skips empty values and returns an empty string when unset', () => {
  expect(
    getBranch(makeDeployment({ meta: { githubCommitRef: '', branch: 'br' } })),
  ).toBe('br');
  expect(getBranch(makeDeployment({ meta: {} }))).toBe('');
  expect(getBranch(makeDeployment({}))).toBe('');
});

test('getCommit shortens to 7 characters and follows provider precedence', () => {
  const full = makeDeployment({
    meta: { githubCommitSha: 'abcdef1234567890' },
  });

  expect(getCommit(full)).toBe('abcdef1');
  expect(getCommit(full, false)).toBe('abcdef1234567890');
  expect(
    getCommit(
      makeDeployment({
        meta: {
          gitlabCommitSha: '1111111aaaa',
          bitbucketCommitSha: '2222222bbbb',
          commitSha: '3333333cccc',
        },
      }),
    ),
  ).toBe('1111111');
  expect(
    getCommit(
      makeDeployment({
        meta: { bitbucketCommitSha: '2222222bbbb', commitSha: '3333333cccc' },
      }),
    ),
  ).toBe('2222222');
  expect(
    getCommit(makeDeployment({ meta: { commitSha: '3333333cccc' } })),
  ).toBe('3333333');
  expect(getCommit(makeDeployment({ meta: { commitSha: 'abc' } }))).toBe('abc');
});

test('getCommit returns N/A when no SHA is present', () => {
  expect(getCommit(makeDeployment({}))).toBe('N/A');
  expect(getCommit(makeDeployment({}), false)).toBe('N/A');
  expect(getCommit(makeDeployment({ meta: { githubCommitSha: '' } }))).toBe(
    'N/A',
  );
});

// Fake theme: getThemeColor returns any value starting with '#' unchanged.
const THEME = {
  defs: {},
  theme: {
    primary: '#000001',
    info: '#000002',
    warning: '#000003',
    success: '#000004',
    error: '#000005',
  },
} as unknown as Theme;

const CHECK = '✓'; // ✓
const DOT = '•'; // •
const CROSS = '✕'; // ✕

type StatusLabel = ReturnType<typeof getStatusInfo>['label'];

const STATUS_CASES: Array<
  [string, DeploymentFixture, StatusLabel, string, string]
> = [
  ['READY', { readyState: 'READY' }, 'READY', CHECK, '#000004'],
  ['QUEUED', { readyState: 'QUEUED' }, 'QUEUED', DOT, '#000002'],
  ['BUILDING', { readyState: 'BUILDING' }, 'BUILDING', DOT, '#000003'],
  [
    'INITIALIZING',
    { readyState: 'INITIALIZING' },
    'INITIALIZING',
    DOT,
    '#000003',
  ],
  ['ERROR', { readyState: 'ERROR' }, 'ERROR', CROSS, '#000005'],
  ['CANCELED', { readyState: 'CANCELED' }, 'CANCELED', CROSS, '#000005'],
  ['DELETED via state', { state: 'DELETED' }, 'DELETED', CROSS, '#000005'],
  ['BUILDING via state', { state: 'BUILDING' }, 'BUILDING', DOT, '#000003'],
  [
    'readyState wins over state',
    { readyState: 'READY', state: 'ERROR' },
    'READY',
    CHECK,
    '#000004',
  ],
  ['no state at all', {}, 'UNKNOWN', DOT, '#000001'],
];

test.each(STATUS_CASES)('getStatusInfo %s', (...row) => {
  const [, fields, label, icon, fg] = row;
  expect(getStatusInfo(makeDeployment(fields), THEME)).toEqual({
    label,
    icon,
    fg,
  });
});
