import { expect, test } from 'bun:test';
import { getBranchesList } from './branches';
import type { Deployment } from '../types/vercel-sdk';

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

const summarize = (list: Array<[string, Deployment]>) =>
  list.map(([branch, deployment]) => [branch, deployment.uid]);

test('getBranchesList keeps the newest deployment per branch, newest first, ties by name', () => {
  const deployments = [
    makeDeployment({
      uid: 'a',
      createdAt: 100,
      meta: { githubCommitRef: 'main' },
    }),
    makeDeployment({
      uid: 'b',
      createdAt: 300,
      meta: { githubCommitRef: 'feat' },
    }),
    makeDeployment({
      uid: 'c',
      createdAt: 200,
      meta: { githubCommitRef: 'main' },
    }),
    makeDeployment({ uid: 'd', createdAt: 400 }),
    makeDeployment({ uid: 'e', createdAt: 300, meta: { branch: 'alpha' } }),
  ];

  // NOTE: 'All' holds the newest deployment that HAS a branch ('b', 300), not
  // the newest overall ('d', 400, no branch). On a createdAt tie ('b' vs 'e',
  // both 300) the first one seen wins. Pinned as current behaviour.
  expect(summarize(getBranchesList(deployments))).toEqual([
    ['All', 'b'],
    ['alpha', 'e'],
    ['feat', 'b'],
    ['main', 'c'],
  ]);
});

test('getBranchesList puts a single deployment under All and its branch', () => {
  const only = makeDeployment({
    uid: 'a',
    createdAt: 100,
    meta: { githubCommitRef: 'main' },
  });
  const list = getBranchesList([only]);

  expect(list).toEqual([
    ['All', only],
    ['main', only],
  ]);
  expect(list[0]?.[1]).toBe(only);
});

test('getBranchesList falls back to created when createdAt is missing', () => {
  const deployments = [
    makeDeployment({ uid: 'x', createdAt: 100, meta: { branch: 'old' } }),
    makeDeployment({ uid: 'y', created: 500, meta: { branch: 'legacy' } }),
  ];

  expect(summarize(getBranchesList(deployments))).toEqual([
    ['All', 'y'],
    ['legacy', 'y'],
    ['old', 'x'],
  ]);
});

test('getBranchesList returns an empty list for no deployments', () => {
  expect(getBranchesList([])).toEqual([]);
});

test('getBranchesList returns an empty list when no deployment has a branch', () => {
  // NOTE: no 'All' entry is produced here even though deployments exist, so
  // the branch panel is empty for projects deployed without git metadata.
  // Pinned as current behaviour.
  const deployments = [makeDeployment({ uid: 'x', createdAt: 100 })];

  expect(getBranchesList(deployments)).toEqual([]);
});
