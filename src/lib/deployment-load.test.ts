import { expect, test } from 'bun:test';
import {
  getDeploymentLoadFlags,
  settleDeploymentFetch,
} from './deployment-load';
import type {
  DeploymentLoadFlags,
  DeploymentLoadInput,
} from './deployment-load';

const CASES: Array<[string, DeploymentLoadInput, DeploymentLoadFlags]> = [
  [
    'before the first fetch starts',
    { isFetching: false, hasCompletedInitialFetch: false },
    { isLoading: true, isRefreshing: false },
  ],
  [
    'first fetch in flight',
    { isFetching: true, hasCompletedInitialFetch: false },
    { isLoading: true, isRefreshing: false },
  ],
  [
    'first fetch settled, including an empty project',
    { isFetching: false, hasCompletedInitialFetch: true },
    { isLoading: false, isRefreshing: false },
  ],
  [
    'later poll keeps the dashboard mounted',
    { isFetching: true, hasCompletedInitialFetch: true },
    { isLoading: false, isRefreshing: true },
  ],
];

test.each(CASES)('getDeploymentLoadFlags %s', (_label, input, expected) => {
  expect(getDeploymentLoadFlags(input)).toEqual(expected);
});

test('settleDeploymentFetch drops a superseded success or failure', () => {
  expect(
    settleDeploymentFetch({
      generation: 1,
      currentGeneration: 2,
      outcome: { ok: true, deployments: ['kept-elsewhere'] },
    }),
  ).toEqual({ status: 'stale' });

  expect(
    settleDeploymentFetch({
      generation: 1,
      currentGeneration: 2,
      outcome: { ok: false, error: new Error('old project') },
    }),
  ).toEqual({ status: 'stale' });
});

test('settleDeploymentFetch keeps a current success', () => {
  expect(
    settleDeploymentFetch({
      generation: 2,
      currentGeneration: 2,
      outcome: { ok: true, deployments: [] },
    }),
  ).toEqual({ status: 'ready', deployments: [] });
});

test('settleDeploymentFetch turns a current failure into an Error', () => {
  const error = new Error('request failed');

  expect(
    settleDeploymentFetch({
      generation: 2,
      currentGeneration: 2,
      outcome: { ok: false, error },
    }),
  ).toEqual({ status: 'failed', error });

  const settled = settleDeploymentFetch({
    generation: 2,
    currentGeneration: 2,
    outcome: { ok: false, error: 'boom' },
  });

  if (settled.status !== 'failed') {
    throw new Error('expected the current fetch to fail');
  }

  expect(settled.error).toBeInstanceOf(Error);
  expect(settled.error.message).toBe('boom');
});
