import { useCallback, useEffect, useState } from 'react';
import { useCtx } from '@/ctx';
import { CONFIG } from '@/lib/config';
import { isDeploymentBuilding } from '@/lib/deployments';
import { appendCappedLogs, capLogs } from '@/lib/log-buffer';
import {
  type LogEvent,
  logEventSchema,
  parseLogEvents,
} from '@/lib/log-events';
import { getStreamObjects } from '@/lib/stream';
import type { Deployment } from '@/types/vercel-sdk';

export type { LogEvent } from '@/lib/log-events';

// Live events are flushed into state at most once per this interval.
const LIVE_FLUSH_MS = 50;

type LogBuffer = {
  logs: Array<LogEvent>;
  droppedCount: number;
};

const EMPTY_LOGS: LogBuffer = { logs: [], droppedCount: 0 };

export const useDeploymentLogs = (deployment: Deployment) => {
  const [logBuffer, setLogBuffer] = useState<LogBuffer>(EMPTY_LOGS);
  const [loading, setLoading] = useState(false);
  const { teamId, setLastError } = useCtx();

  const { bearerToken } = CONFIG.get();
  const isLive = isDeploymentBuilding(deployment);

  const fetchFiniteLogs = useCallback(
    async (signal: AbortSignal) => {
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
            signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch deployment logs (${response.status})`,
          );
        }

        const body: unknown = await response.json();
        if (signal.aborted) {
          return;
        }
        setLogBuffer(capLogs(parseLogEvents(body)));
      } finally {
        setLoading(false);
      }
    },
    [bearerToken, deployment.uid, teamId],
  );

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

      let pending: Array<LogEvent> = [];
      let timer: ReturnType<typeof setTimeout> | undefined;

      const flush = () => {
        timer = undefined;
        const batch = pending;
        pending = [];
        // After cleanup, drop whatever is left instead of writing stale state.
        if (controller.signal.aborted || batch.length === 0) {
          return;
        }
        setLogBuffer(prev =>
          appendCappedLogs(prev.logs, batch, prev.droppedCount),
        );
      };

      try {
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

          pending.push(event);
          timer ??= setTimeout(flush, LIVE_FLUSH_MS);
        }
      } finally {
        clearTimeout(timer);
        flush();
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
    // Anything that rejects after our own cleanup is an abort, not an error.
    const onError = (err: unknown) => {
      if (!controller.signal.aborted) {
        handleError(err);
      }
    };

    if (isLive) {
      fetchLiveLogs(controller).catch(onError);
    } else {
      fetchFiniteLogs(controller.signal).catch(onError);
    }

    return () => {
      controller.abort();
    };
  }, [isLive, fetchFiniteLogs, fetchLiveLogs, handleError]);

  return {
    logs: logBuffer.logs,
    loading,
    droppedCount: logBuffer.droppedCount,
  };
};
