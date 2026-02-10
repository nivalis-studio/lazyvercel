import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { useCtx } from '@/ctx';
import { CONFIG } from '@/lib/config';
import { isDeploymentBuilding } from '@/lib/deployments';
import { getStreamObjects } from '@/lib/stream';
import type { Deployment } from '@/types/vercel-sdk';

const logEventSchema = z.object({
  created: z.number().transform(val => new Date(val)),
  text: z.string(),
  level: z.enum(['warning', 'error']).optional(),
  type: z.string(),
});

export type LogEvent = z.infer<typeof logEventSchema>;

export const useDeploymentLogs = (deployment: Deployment) => {
  const [logs, setLogs] = useState<Array<LogEvent>>([]);
  const [loading, setLoading] = useState(false);
  const { teamId, setLastError } = useCtx();

  const { bearerToken } = CONFIG.get();
  const isLive = isDeploymentBuilding(deployment);

  const fetchFiniteLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        follow: '0',
        limit: '-1',
        teamId,
      });

      const response = await fetch(
        `https://api.vercel.com/v3/deployments/${deployment.uid}/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch deployment logs (${response.status})`);
      }

      const body = await response.json();
      const parsed = z.array(logEventSchema).parse(body);
      setLogs(parsed);
    } finally {
      setLoading(false);
    }
  }, [bearerToken, deployment.uid, teamId]);

  const fetchLiveLogs = useCallback(
    async (controller: AbortController) => {
      setLoading(true);
      const params = new URLSearchParams({
        follow: '1',
        limit: '-1',
        teamId,
      });

      // Avoid blocking the UI forever when a live stream is connected but idle.
      setLoading(false);

      for await (const event of getStreamObjects({
        url: `https://api.vercel.com/v3/deployments/${deployment.uid}/events?${params.toString()}`,
        options: {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            Accept: 'application/json',
          },
          signal: controller.signal,
        },
        schema: logEventSchema,
      })) {
        if (!event) {
          continue;
        }

        setLogs(prev => [...prev, event]);
      }
    },
    [bearerToken, deployment.uid, teamId],
  );

  const handleError = useCallback(
    (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      setLastError(error);
      setLoading(false);
    },
    [setLastError],
  );

  useEffect(() => {
    const controller = new AbortController();
    if (isLive) {
      fetchLiveLogs(controller).catch(handleError);
    } else {
      fetchFiniteLogs().catch(handleError);
    }

    return () => {
      controller.abort();
    };
  }, [isLive, fetchFiniteLogs, fetchLiveLogs, handleError]);

  return { logs, loading };
};
