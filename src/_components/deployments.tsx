import { TextAttributes } from '@opentui/core';
import { getTimeAgo } from '@/lib/time-ago';
import type { Deployment, Deployments, Project } from '@/types/vercel-sdk';

type Props = {
  project: Project;
  deployments: Deployments;
};

const getCreatedAt = (d: Deployment) => d.createdAt ?? d.created;

const formatRelativeTime = (ts: number) => {
  return getTimeAgo(new Date(ts));
};

const getBranch = (d: Deployment) =>
  d.meta?.githubCommitRef ||
  d.meta?.gitlabCommitRef ||
  d.meta?.bitbucketCommitRef ||
  d.meta?.commitRef ||
  d.meta?.branch ||
  '';

const getCommit = (d: Deployment) => {
  const sha =
    d.meta?.githubCommitSha ||
    d.meta?.gitlabCommitSha ||
    d.meta?.bitbucketCommitSha ||
    d.meta?.commitSha ||
    '';
  return sha ? sha.slice(0, 7) : '';
};

const getStatusInfo = (d: Deployment) => {
  const state = d.readyState || d.state || 'UNKNOWN';
  let fg = '#cccccc';
  if (state === 'READY') {
    fg = 'green';
  } else if (
    state === 'BUILDING' ||
    state === 'INITIALIZING' ||
    state === 'QUEUED'
  ) {
    fg = 'yellow';
  } else if (state === 'ERROR' || state === 'CANCELED' || state === 'DELETED') {
    fg = 'red';
  }
  return { label: state, fg } as const;
};

const truncate = (str: string, len: number) =>
  str.length > len ? `${str.slice(0, Math.max(0, len - 1))}…` : str;

type Column = { label: string; width?: number; flex?: number };

const columns: Array<Column> = [
  { label: 'Time', width: 12 },
  { label: 'Status', width: 12 },
  { label: 'Target', width: 10 },
  { label: 'URL', flex: 1 },
  { label: 'Branch', width: 18 },
  { label: 'Commit', width: 8 },
];

export const DeploymentsList = ({ deployments, project }: Props) => {
  const [timeCol, statusCol, targetCol, , branchCol, commitCol] = columns as [
    Column,
    Column,
    Column,
    Column,
    Column,
    Column,
  ];
  const sorted = [...deployments].sort(
    (a, b) => getCreatedAt(b) - getCreatedAt(a),
  );

  return (
    <box flexDirection='column' flexGrow={1} padding={1}>
      <box alignItems='flex-end' justifyContent='flex-start' marginBottom={1}>
        <ascii-font font='tiny' text={project.name} />
      </box>

      <box border flexDirection='column' flexGrow={1} title='Deployments'>
        {/* Header */}
        <box
          paddingLeft={1}
          paddingRight={1}
          style={{ backgroundColor: '#1f2335' }}
        >
          <box flexDirection='row' gap={2}>
            {columns.map(col => (
              <box
                key={col.label}
                style={{ width: col.width, flexGrow: col.flex ?? 0 }}
              >
                <text attributes={TextAttributes.DIM}>{col.label}</text>
              </box>
            ))}
          </box>
        </box>

        {/* Rows */}
        <box flexDirection='column' gap={0} paddingLeft={1} paddingRight={1}>
          {sorted.map(d => {
            const createdAt = getCreatedAt(d);
            const status = getStatusInfo(d);
            const branch = getBranch(d);
            const commit = getCommit(d);

            return (
              <box flexDirection='row' gap={2} key={d.uid}>
                {/* Time */}
                <box style={{ width: timeCol.width }}>
                  <text attributes={TextAttributes.DIM}>
                    {formatRelativeTime(createdAt)}
                  </text>
                </box>

                {/* Status */}
                <box style={{ width: statusCol.width }}>
                  <text fg={status.fg}>{status.label}</text>
                </box>

                {/* Target */}
                <box style={{ width: targetCol.width }}>
                  <text>{d.target ?? ''}</text>
                </box>

                {/* URL */}
                <box style={{ flexGrow: 1 }}>
                  <text>{truncate(d.url, 48)}</text>
                </box>

                {/* Branch */}
                <box style={{ width: branchCol.width }}>
                  <text>{truncate(branch, branchCol.width ?? 18)}</text>
                </box>

                {/* Commit */}
                <box style={{ width: commitCol.width }}>
                  <text attributes={TextAttributes.DIM}>{commit}</text>
                </box>
              </box>
            );
          })}
        </box>
      </box>
    </box>
  );
};
