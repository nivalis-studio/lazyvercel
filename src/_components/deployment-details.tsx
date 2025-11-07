import { TextAttributes } from '@opentui/core';
import open from 'open';
import { useEffect, useState } from 'react';
import { useDeploymentDetailsShortcuts } from '@/hooks/use-deployment-shortcuts';
import {
  getBranch,
  getCommit,
  getCreatedAt,
  getStatusInfo,
} from '@/lib/extract-deploy-details';
import theme from '@/theme/catppuccin.json' with { type: 'json' };
import { getVercel } from '@/vercel';
import type { Deployment, Project } from '@/types/vercel-sdk';

type Props = {
  deployment: Deployment;
  project: Project;
  teamId: string;
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

export const DeploymentDetails = ({ deployment, project, teamId }: Props) => {
  const status = getStatusInfo(deployment);
  const branch = getBranch(deployment);
  const commit = getCommit(deployment);
  const createdAt = new Date(getCreatedAt(deployment));

  const [logs, setLogs] = useState<Array<LogEvent>>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    const isBuilding =
      deployment.readyState === 'BUILDING' ||
      deployment.readyState === 'INITIALIZING' ||
      deployment.readyState === 'QUEUED' ||
      deployment.state === 'BUILDING' ||
      deployment.state === 'INITIALIZING' ||
      deployment.state === 'QUEUED';

    const fetchLogs = async () => {
      try {
        const vercel = getVercel();
        const response = await vercel.deployments.getDeploymentEvents({
          idOrUrl: deployment.uid,
          teamId,
          follow: isBuilding ? 1 : 0,
          limit: -1,
        });

        const events = Array.isArray(response) ? response : [];
        setLogs(events as Array<LogEvent>);
        setIsLoadingLogs(false);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        setIsLoadingLogs(false);
      }
    };

    fetchLogs().catch(console.error);
  }, [deployment.uid, deployment.readyState, deployment.state, teamId]);

  useDeploymentDetailsShortcuts({
    onBack: () => {
      // This is called from parent, so no-op here
    },
    onOpenBrowser: () => {
      const url = `https://vercel.com/${teamId}/${project.name}/${deployment.uid}`;
      open(url).catch(err => console.error(err));
    },
  });

  const buildLogs = logs.filter(
    log =>
      log.type === 'stdout' ||
      log.type === 'stderr' ||
      log.type === 'command' ||
      log.type === 'exit',
  );

  return (
    <box flexDirection='column' flexGrow={1} padding={1}>
      <box alignItems='flex-end' justifyContent='flex-start' marginBottom={1}>
        <ascii-font font='tiny' text={project.name} />
      </box>

      <box flexDirection='row' gap={1} height='100%'>
        <box
          border
          flexDirection='column'
          style={{ width: 40 }}
          title='Deployment Info'
        >
          <box flexDirection='column' gap={1} padding={1}>
            <box flexDirection='column'>
              <text attributes={TextAttributes.DIM}>URL:</text>
              <text>{deployment.url}</text>
            </box>

            <box flexDirection='column'>
              <text attributes={TextAttributes.DIM}>Status:</text>
              <text fg={status.fg}>{status.label}</text>
            </box>

            <box flexDirection='column'>
              <text attributes={TextAttributes.DIM}>Branch:</text>
              <text>{branch || 'N/A'}</text>
            </box>

            <box flexDirection='column'>
              <text attributes={TextAttributes.DIM}>Commit:</text>
              <text>{commit}</text>
            </box>

            <box flexDirection='column'>
              <text attributes={TextAttributes.DIM}>Target:</text>
              <text>{deployment.target ?? 'N/A'}</text>
            </box>

            <box flexDirection='column'>
              <text attributes={TextAttributes.DIM}>Created:</text>
              <text>{createdAt.toLocaleString()}</text>
            </box>

            <box marginTop={2}>
              <text attributes={TextAttributes.DIM}>
                BACKSPACE: back{'\n'}O: open in browser
              </text>
            </box>
          </box>
        </box>

        <box border flexDirection='column' flexGrow={1} title='Build Logs'>
          <box flexDirection='column' padding={1}>
            {isLoadingLogs && (
              <text attributes={TextAttributes.DIM}>Loading logs...</text>
            )}
            {!isLoadingLogs && buildLogs.length === 0 && (
              <text attributes={TextAttributes.DIM}>
                No build logs available
              </text>
            )}
            {!isLoadingLogs &&
              buildLogs.length > 0 &&
              buildLogs.map((log, index) => {
                const logText = log.payload?.text || log.text || '';
                const logType = log.type;
                let fg = theme.defs.darkText;

                if (logType === 'stderr') {
                  fg = theme.defs.darkRed;
                } else if (logType === 'command') {
                  fg = theme.defs.darkBlue;
                }

                const logKey = `${log.created || 0}-${index}`;

                return (
                  <box flexDirection='row' key={logKey}>
                    <text fg={fg}>{logText}</text>
                  </box>
                );
              })}
          </box>
        </box>
      </box>
    </box>
  );
};
