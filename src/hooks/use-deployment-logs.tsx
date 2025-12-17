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
  const { teamId } = useCtx();

  const { bearerToken } = CONFIG.get();
  const isLive = isDeploymentBuilding(deployment);

  const fetchFiniteLogs = useCallback(async () => {
    setLoading(true);
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
    setLoading(false);
  }, [bearerToken, deployment.uid, teamId]);

  const fetchLiveLogs = useCallback(
    async (controller: AbortController) => {
      setLoading(true);
      const params = new URLSearchParams({
        follow: '1',
        limit: '-1',
        teamId,
      });

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
          return;
        }

        setLogs(prev => [...prev, event]);
        setLoading(false);
      }
    },
    [bearerToken, deployment.uid, teamId],
  );

  useEffect(() => {
    const controller = new AbortController();
    if (isLive) {
      fetchLiveLogs(controller).catch(console.error);
    } else {
      fetchFiniteLogs().catch(console.error);
    }

    return () => {
      controller.abort();
    };
  }, [isLive, fetchFiniteLogs, fetchLiveLogs]);

  return { logs, loading };
};
