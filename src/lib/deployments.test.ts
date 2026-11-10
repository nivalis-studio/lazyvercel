import { expect, test } from 'bun:test';
import { isDeploymentBuilding } from './deployments';
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
