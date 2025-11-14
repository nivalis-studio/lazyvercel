import { useCallback, useEffect, useState } from 'react';
import { useCtx } from '@/ctx';
import { fetchProjectDeployments } from '@/lib/deployments';
import type { Deployments } from '@/types/vercel-sdk';

const REFETCH_INTERVAL_MS = 10_000;

export const useDeployments = (projectId: string) => {
  const { teamId } = useCtx();
  const [isLoading, setIsLoading] = useState(true);
  const [deployments, setDeployments] = useState<Deployments>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchDeployment = useCallback(async () => {
    setIsLoading(true);
    const deployments_ = await fetchProjectDeployments(projectId, teamId);
    setDeployments(deployments_);
    setIsLoading(false);
  }, [teamId, projectId]);

  const handleErr = useCallback((err: unknown) => {
    setError(err instanceof Error ? err : new Error(String(err)));
  }, []);

  useEffect(() => {
    fetchDeployment().catch(handleErr);

    const interval = setInterval(
      () => fetchDeployment().catch(handleErr),
      REFETCH_INTERVAL_MS,
    );

    return () => clearInterval(interval);
  }, [fetchDeployment, handleErr]);

  if (error) {
    throw error;
  }

  return {
    isLoading: isLoading && !deployments.length,
    deployments,
    refresh: fetchDeployment,
  };
};
