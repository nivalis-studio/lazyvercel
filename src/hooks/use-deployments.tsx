import { useCallback, useEffect, useState } from 'react';
import { useCtx } from '@/app';
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

  useEffect(() => {
    const interval = setInterval(
      () =>
        fetchDeployment().catch(err => {
          setError(err instanceof Error ? err : new Error(String(err)));
        }),
      REFETCH_INTERVAL_MS,
    );

    () => {
      clearInterval(interval);
    };
  }, [fetchDeployment]);

  if (error) {
    throw error;
  }

  return {
    isLoading: isLoading && !deployments.length,
    deployments,
    refresh: fetchDeployment,
  };
};
