import { type ScrollBoxRenderable, TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { memo, useRef } from 'react';
import { QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
import { type LogEvent, useDeploymentLogs } from '@/hooks/use-deployment-logs';
import { omittedLogNotice } from '@/lib/log-buffer';
import { formatLogTimestamp } from '@/lib/log-events';
import { openUrl } from '@/lib/open-url';
import type { Ctx } from '@/types/ctx';
import type { Deployment } from '@/types/vercel-sdk';

type LogLineProps = {
  log: LogEvent;
  getColor: Ctx['getColor'];
};

const logLineColor = (log: LogEvent, getColor: Ctx['getColor']): string => {
  if (log.level === 'warning') {
    return getColor('warning');
  }

  if (log.type === 'stderr' || log.level === 'error') {
    return getColor('error');
  }

  return getColor('markdownText');
};

const LogLine = memo(function LogLineView({ log, getColor }: LogLineProps) {
  return (
    <box flexDirection='row' gap={1}>
      <text fg={getColor('syntaxComment')} flexShrink={0}>
        {formatLogTimestamp(log.created)}
      </text>
      <text fg={logLineColor(log, getColor)}>{log.text || ''}</text>
    </box>
  );
});

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

  const { logs, loading, droppedCount } = useDeploymentLogs(deployment);

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

  const omittedNotice = omittedLogNotice(droppedCount);

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
      {omittedNotice ? (
        <text attributes={TextAttributes.DIM}>{omittedNotice}</text>
      ) : null}

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

        {!loading &&
          logs.length > 0 &&
          logs.map(log => (
            <LogLine getColor={getColor} key={log.id} log={log} />
          ))}
      </scrollbox>
    </box>
  );
};
