import { DEFAULT_BRANCH } from '@/constants';
import { useCtx } from '@/ctx';

type Props = {
  selectedBranch: string;
  deploymentsCount: number;
  totalDeploymentsCount: number;
  lastRefreshedAt: number | null;
  isRefreshing: boolean;
  view: 'list' | 'details';
};

export const StatusBar = ({
  selectedBranch,
  deploymentsCount,
  totalDeploymentsCount,
  lastRefreshedAt,
  isRefreshing,
  view,
}: Props) => {
  const { getColor, lastError, project } = useCtx();

  const branchLabel =
    selectedBranch === DEFAULT_BRANCH ? 'all' : selectedBranch || 'all';

  // Absolute local time of the last successful refresh: it stops advancing
  // when polling fails, so stale data is visible without a ticking timer.
  const refreshedLabel = lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
    : 'never';

  return (
    <box
      alignItems='center'
      flexDirection='row'
      height={1}
      justifyContent='space-between'
      style={{
        backgroundColor: getColor('backgroundPanel'),
        paddingLeft: 1,
        paddingRight: 1,
      }}
      width='100%'
    >
      <box alignItems='center' flexDirection='row' gap={2}>
        <text fg={getColor('textMuted')} wrapMode='none'>
          {project ? `Project: ${project.name}` : 'Project: -'}
        </text>
        <text fg={getColor('textMuted')} wrapMode='none'>
          {`Branch: ${branchLabel}`}
        </text>
        <text fg={getColor('textMuted')} wrapMode='none'>
          {`View: ${view}`}
        </text>
        <text fg={getColor('textMuted')} wrapMode='none'>
          {`Deployments: ${deploymentsCount}/${totalDeploymentsCount}`}
        </text>
      </box>

      <box alignItems='center' flexDirection='row' gap={2}>
        {lastError ? (
          <text fg={getColor('error')} wrapMode='none'>
            Error
          </text>
        ) : null}
        <text fg={isRefreshing ? getColor('warning') : getColor('textMuted')}>
          {isRefreshing ? 'Refreshing...' : `Refreshed: ${refreshedLabel}`}
        </text>
        <text fg={getColor('textMuted')} wrapMode='none'>
          Ctrl+P palette
        </text>
        <text fg={getColor('textMuted')} wrapMode='none'>
          Ctrl+E error
        </text>
        <text fg={getColor('textMuted')} wrapMode='none'>
          r refresh
        </text>
        <text fg={getColor('textMuted')} wrapMode='none'>
          ? help
        </text>
        <text fg={getColor('textMuted')} wrapMode='none'>
          Shift+Q quit
        </text>
      </box>
    </box>
  );
};
