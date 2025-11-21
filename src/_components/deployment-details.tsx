import { type ScrollBoxRenderable, TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import open from 'open';
import { useEffect, useRef, useState } from 'react';
import { QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
import { CONFIG } from '@/lib/config';
import {
  getBranch,
  getCommit,
  getCreatedAt,
  getStatusInfo,
} from '@/lib/extract-deploy-details';
import type { Deployment } from '@/types/vercel-sdk';

type Props = {
  deployment: Deployment;
  focused: boolean;
  getFocus: () => void;
  onDeploymentUnselect: () => void;
};

export const DeploymentDetails = ({
  focused,
  getFocus,
  deployment,
  onDeploymentUnselect,
  ...props
}: Props) => {
  const { getColor, ...ctx } = useCtx();
  const status = getStatusInfo(deployment, ctx.theme);
  const branch = getBranch(deployment);
  const commit = getCommit(deployment, false);
  const createdAt = new Date(getCreatedAt(deployment));
  const scrollRef = useRef<ScrollBoxRenderable | null>(null);

  useKeyboard(key => {
    if (!focused) {
      return;
    }

    if (QUITTING_KEYS.includes(key.name)) {
      onDeploymentUnselect();
      return;
    }

    if (key.name === 'o') {
      const url = deployment.url;
      if (!url) {
        return;
      }

      open(url).catch(error => {
        console.error('Failed to open URL:', error);
      });
      return;
    }
  });

  return (
    <box
      borderColor={focused ? getColor('secondary') : getColor('borderSubtle')}
      borderStyle='rounded'
      flexDirection='column'
      height='100%'
      onMouseOver={getFocus}
      padding={1}
      title={deployment.uid}
      width='25%'
      {...props}
    >
      <scrollbox
        flexDirection='column'
        flexGrow={1}
        overflow='scroll'
        ref={scrollRef}
      >
        <box flexDirection='column' gap={1} padding={1}>
          <box flexDirection='column'>
            <text attributes={TextAttributes.DIM}>Status:</text>
            <text fg={status.fg}>{status.label}</text>
          </box>

          <box flexDirection='column'>
            <text attributes={TextAttributes.DIM}>Created:</text>
            <text>{createdAt.toLocaleString()}</text>
          </box>

          <box flexDirection='column'>
            <text attributes={TextAttributes.DIM}>URL:</text>
            <text>{deployment.url}</text>
          </box>

          <box marginTop={-1}>
            <text attributes={TextAttributes.DIM}>
              Press o to open in browser
            </text>
          </box>

          <box flexDirection='column'>
            <text attributes={TextAttributes.DIM}>Target:</text>
            <text>{deployment.target || 'N/A'}</text>
          </box>

          <box flexDirection='column'>
            <text attributes={TextAttributes.DIM}>Branch:</text>
            <text>{branch || 'N/A'}</text>
          </box>

          <box flexDirection='column'>
            <text attributes={TextAttributes.DIM}>Commit:</text>
            <text>{commit}</text>
          </box>

          <box marginTop={2}>
            <text attributes={TextAttributes.DIM}>q: back</text>
          </box>
        </box>
      </scrollbox>
    </box>
  );
};

type LogEvent = {
  type: string;
  created?: number;
  payload?: {
    text?: string;
    info?: {
      type?: string;
    };
  };
  text?: string;
};

export const DeploymentLogs = ({
  focused,
  getFocus,
  deployment,
  onDeploymentUnselect,
  ...props
}: Props) => {
  const { getColor, teamId } = useCtx();
  const scrollRef = useRef<ScrollBoxRenderable | null>(null);
  const [logs, setLogs] = useState<Array<LogEvent>>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useKeyboard(key => {
    if (!focused) {
      return;
    }

    if (focused && QUITTING_KEYS.includes(key.name)) {
      onDeploymentUnselect();
      return;
    }
  });

  useEffect(() => {
    setLogs([]);
    setIsLoadingLogs(true);

    const isBuilding =
      deployment.readyState === 'BUILDING' ||
      deployment.readyState === 'INITIALIZING' ||
      deployment.readyState === 'QUEUED' ||
      deployment.state === 'BUILDING' ||
      deployment.state === 'INITIALIZING' ||
      deployment.state === 'QUEUED';

    let cancelled: true | false = false;

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: okay-ish
    const fetchLogs = async () => {
      try {
        const vercel = CONFIG.getVercel();
        const response = await vercel.deployments.getDeploymentEvents({
          idOrUrl: deployment.uid,
          teamId,
          follow: isBuilding ? 1 : 0,
          limit: -1,
        });

        if (cancelled) {
          return;
        }

        const events = Array.isArray(response) ? response : [];
        setLogs(events as Array<LogEvent>);
        setIsLoadingLogs(false);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch logs:', error);
          setIsLoadingLogs(false);
        }
      }
    };

    fetchLogs().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [deployment.uid, deployment.readyState, deployment.state, teamId]);

  return (
    <box
      borderColor={focused ? getColor('secondary') : getColor('borderSubtle')}
      borderStyle='rounded'
      flexDirection='column'
      height='100%'
      onMouseOver={getFocus}
      padding={1}
      title={deployment.uid}
      {...props}
    >
      <scrollbox
        flexDirection='column'
        flexGrow={1}
        overflow='scroll'
        ref={scrollRef}
      >
        {isLoadingLogs && (
          <text attributes={TextAttributes.DIM}>Loading logs...</text>
        )}
        {!isLoadingLogs && logs.length === 0 && (
          <text attributes={TextAttributes.DIM}>No build logs available</text>
        )}
        {!isLoadingLogs &&
          logs.length > 0 &&
          logs.map((log, index) => {
            const logText = log.payload?.text || log.text || '';
            const logType = log.type;
            let fg = getColor('markdownText');

            if (logType === 'stderr') {
              fg = getColor('error');
            } else if (logType === 'command') {
              fg = getColor('markdownText');
            }

            const logKey = `${log.created || 0}-${index}`;

            return (
              <box flexDirection='row' key={logKey}>
                <text fg={fg}>{logText}</text>
              </box>
            );
          })}
      </scrollbox>
    </box>
  );
};
