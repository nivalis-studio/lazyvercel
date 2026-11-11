import { useCallback, useEffect, useRef, useState } from 'react';
import { useCtx } from '@/ctx';
import {
  getDeploymentLoadFlags,
  settleDeploymentFetch,
} from '@/lib/deployment-load';
import { fetchProjectDeployments } from '@/lib/deployments';
import type { DeploymentFetchOutcome } from '@/lib/deployment-load';
import type { Deployments } from '@/types/vercel-sdk';

const REFETCH_INTERVAL_MS = 10_000;

const readDeployments = async (
  projectId: string,
  teamId: string,
): Promise<DeploymentFetchOutcome<Deployments>> => {
  try {
    return {
      ok: true,
      deployments: await fetchProjectDeployments(projectId, teamId),
    };
  } catch (err) {
    return { ok: false, error: err };
  }
};

export const useDeployments = (projectId: string) => {
  const { teamId, setLastError } = useCtx();
  const [isFetching, setIsFetching] = useState(true);
  const [hasCompletedInitialFetch, setHasCompletedInitialFetch] =
    useState(false);
  const [deployments, setDeployments] = useState<Deployments>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const generationRef = useRef(0);

  const fetchDeployment = useCallback(() => {
    const execute = async () => {
      generationRef.current += 1;
      const generation = generationRef.current;
      setIsFetching(true);

      const outcome = await readDeployments(projectId, teamId);
      const settled = settleDeploymentFetch({
        generation,
        currentGeneration: generationRef.current,
        outcome,
      });

      if (settled.status === 'stale') {
        return;
      }

      if (settled.status === 'ready') {
        setDeployments(settled.deployments);
        setLastRefreshedAt(Date.now());
      } else {
        setLastError(settled.error);
      }

      setIsFetching(false);
      setHasCompletedInitialFetch(true);
    };

    execute().catch(() => {
      // Recorded on lastError for the current generation only.
    });
  }, [teamId, projectId, setLastError]);

  useEffect(() => {
    fetchDeployment();

    const interval = setInterval(() => {
      fetchDeployment();
    }, REFETCH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      // Invalidate in-flight fetches so a previous project's late
      // response can never land after a projectId/teamId change.
      generationRef.current += 1;
      setDeployments([]);
      setLastRefreshedAt(null);
      setIsFetching(true);
      setHasCompletedInitialFetch(false);
    };
  }, [fetchDeployment]);

  const { isLoading, isRefreshing } = getDeploymentLoadFlags({
    isFetching,
    hasCompletedInitialFetch,
  });

  return {
    isLoading,
    isRefreshing,
    deployments,
    lastRefreshedAt,
    refresh: fetchDeployment,
  };
};
