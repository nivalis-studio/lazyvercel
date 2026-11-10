import { type ScrollBoxRenderable, TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useRef } from 'react';
import { QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
import { type LogEvent, useDeploymentLogs } from '@/hooks/use-deployment-logs';
import { openUrl } from '@/lib/open-url';
import type { Deployment } from '@/types/vercel-sdk';

type Props = {
  deployment: Deployment;
  focused: boolean;
  getFocus: () => void;
  onDeploymentUnselect: () => void;
};

export const DeploymentLogs = ({
  deployment,
  focused,
  getFocus,
  onDeploymentUnselect,
  ...props
}: Props) => {
  const { getColor, setLastError } = useCtx();
  const scrollRef = useRef<ScrollBoxRenderable | null>(null);

  const { logs, loading } = useDeploymentLogs(deployment);

  useKeyboard(key => {
    if (!focused) {
      return;
    }

    if (QUITTING_KEYS.includes(key.name)) {
      onDeploymentUnselect();
      return;
    }

    if (key.name === 'o') {
      if (deployment.url) {
        openUrl(deployment.url, setLastError);
      }
      return;
    }
  });

  const renderLogLine = (log: LogEvent, index: number) => {
    const logText = log.text || '';
    const logType = log.type;

    let fg = getColor('markdownText');
    if (logType === 'stderr' || log.level === 'error') {
      fg = getColor('error');
    }

    if (log.level === 'warning') {
      fg = getColor('warning');
    }

    const key = `${log.created}-${index}`;

    return (
      <box flexDirection='row' gap={1} key={key}>
        <text fg={getColor('syntaxComment')} flexShrink={0}>
          {log.created.toLocaleString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </text>
        <text fg={fg}>{logText}</text>
      </box>
    );
  };

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
        stickyScroll
        stickyStart='bottom'
      >
        {loading && (
          <text attributes={TextAttributes.DIM}>Loading logs...</text>
        )}

        {!loading && logs.length === 0 && (
          <text attributes={TextAttributes.DIM}>No build logs available</text>
        )}

        {!loading && logs.length > 0 && logs.map(renderLogLine)}
      </scrollbox>
    </box>
  );
};
