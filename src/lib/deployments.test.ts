import { expect, test } from 'bun:test';
import { deploymentsResponseSchema, isDeploymentBuilding } from './deployments';
import type { Deployment } from '../types/vercel-sdk';

type DeploymentFixture = {
  readyState?: string;
  state?: string;
};

const makeDeployment = (fields: DeploymentFixture): Deployment =>
  ({ uid: 'dpl_test', created: 0, ...fields }) as unknown as Deployment;

const CASES: Array<[string, DeploymentFixture, boolean]> = [
  ['readyState BUILDING', { readyState: 'BUILDING' }, true],
  ['readyState INITIALIZING', { readyState: 'INITIALIZING' }, true],
  ['readyState QUEUED', { readyState: 'QUEUED' }, true],
  ['state BUILDING', { state: 'BUILDING' }, true],
  ['state INITIALIZING', { state: 'INITIALIZING' }, true],
  ['state QUEUED', { state: 'QUEUED' }, true],
  ['readyState READY', { readyState: 'READY' }, false],
  ['readyState ERROR', { readyState: 'ERROR' }, false],
  ['readyState CANCELED', { readyState: 'CANCELED' }, false],
  ['no state at all', {}, false],
  // NOTE: readyState and state are OR-ed here, while getStatusInfo prefers
  // readyState. A READY deployment with a stale BUILDING state counts as
  // building but displays as READY. Pinned as current behaviour.
  [
    'readyState READY with state BUILDING',
    { readyState: 'READY', state: 'BUILDING' },
    true,
  ],
];

test.each(CASES)('isDeploymentBuilding %s', (_name, fields, expected) => {
  expect(isDeploymentBuilding(makeDeployment(fields))).toBe(expected);
});

test('deploymentsResponseSchema keeps the read fields and tolerates unknown states', () => {
  const body = {
    deployments: [
      {
        uid: 'dpl_1',
        url: 'app-git-main.vercel.app',
        created: 1,
        createdAt: 2,
        readyState: 'BLOCKED',
        target: null,
        meta: { githubCommitRef: 'main' },
        name: 'ignored-field',
      },
    ],
    pagination: { count: 1, next: null, prev: null },
  };

  const [deployment] = deploymentsResponseSchema.parse(body).deployments;

  expect(deployment?.uid).toBe('dpl_1');
  expect(deployment?.readyState).toBe('BLOCKED');
  expect(deployment?.target).toBeNull();
  expect(deployment?.meta?.githubCommitRef).toBe('main');
});

test('deploymentsResponseSchema rejects a deployment without uid', () => {
  expect(() =>
    deploymentsResponseSchema.parse({
      deployments: [{ url: 'x.vercel.app', created: 1 }],
    }),
  ).toThrow();
});
