import { useCallback, useEffect, useRef, useState } from 'react';
import { useCtx } from '@/ctx';
import { fetchProjectDeployments } from '@/lib/deployments';
import type { Deployments } from '@/types/vercel-sdk';

const REFETCH_INTERVAL_MS = 10_000;

export const useDeployments = (projectId: string) => {
  const { teamId, setLastError } = useCtx();
  const [isLoading, setIsLoading] = useState(true);
  const [deployments, setDeployments] = useState<Deployments>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const generationRef = useRef(0);

  const fetchDeployment = useCallback(async () => {
    generationRef.current += 1;
    const generation = generationRef.current;

    setIsLoading(true);

    try {
      const deployments_ = await fetchProjectDeployments(projectId, teamId);

      // Discard stale responses that resolved after a newer fetch started.
      if (generation !== generationRef.current) {
        return;
      }

      setDeployments(deployments_);
      setLastRefreshedAt(Date.now());
    } finally {
      if (generation === generationRef.current) {
        setIsLoading(false);
      }
    }
  }, [teamId, projectId]);

  const handleErr = useCallback(
    (err: unknown) => {
      setLastError(err instanceof Error ? err : new Error(String(err)));
    },
    [setLastError],
  );

  useEffect(() => {
    fetchDeployment().catch(handleErr);

    const interval = setInterval(
      () => fetchDeployment().catch(handleErr),
      REFETCH_INTERVAL_MS,
    );

    return () => {
      clearInterval(interval);
      // Invalidate in-flight fetches so a previous project's late
      // response can never land after a projectId/teamId change.
      generationRef.current += 1;
      setDeployments([]);
      setLastRefreshedAt(null);
    };
  }, [fetchDeployment, handleErr]);

  return {
    isLoading: isLoading && !deployments.length,
    isRefreshing: isLoading && deployments.length > 0,
    deployments,
    lastRefreshedAt,
    refresh: fetchDeployment,
  };
};
