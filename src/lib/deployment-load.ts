export type DeploymentLoadInput = {
  readonly isFetching: boolean;
  readonly hasCompletedInitialFetch: boolean;
};

export type DeploymentLoadFlags = {
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
};

export type DeploymentFetchOutcome<TDeployment> =
  | { readonly ok: true; readonly deployments: TDeployment }
  | { readonly ok: false; readonly error: unknown };

export type SettledDeploymentFetch<TDeployment> =
  | { readonly status: 'stale' }
  | { readonly status: 'ready'; readonly deployments: TDeployment }
  | { readonly status: 'failed'; readonly error: Error };

const toError = (err: unknown): Error => {
  if (err instanceof Error) {
    return err;
  }

  return new Error(String(err));
};

/**
 * Full-screen loader until the first fetch settles (success or failure).
 * Later polls report isRefreshing, so a project with zero deployments
 * keeps its dashboard mounted across the 10s poll.
 */
export const getDeploymentLoadFlags = (
  input: DeploymentLoadInput,
): DeploymentLoadFlags => {
  return {
    isLoading: !input.hasCompletedInitialFetch,
    isRefreshing: input.hasCompletedInitialFetch && input.isFetching,
  };
};

/**
 * Keep a fetch only when it is still the latest one. A stale failure is
 * dropped so a project the user has left cannot write lastError.
 */
export const settleDeploymentFetch = <TDeployment>(input: {
  readonly generation: number;
  readonly currentGeneration: number;
  readonly outcome: DeploymentFetchOutcome<TDeployment>;
}): SettledDeploymentFetch<TDeployment> => {
  if (input.generation !== input.currentGeneration) {
    return { status: 'stale' };
  }

  if (!input.outcome.ok) {
    return { status: 'failed', error: toError(input.outcome.error) };
  }

  return { status: 'ready', deployments: input.outcome.deployments };
};
