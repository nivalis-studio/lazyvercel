import { useCtx } from '@/ctx';
import {
  getBranch,
  getCommit,
  getCreatedAt,
  getStatusInfo,
} from '@/lib/extract-deploy-details';
import { getTimeAgo } from '@/lib/time-ago';
import { type Column, columns, getColumnStyle } from './columns';
import type { Deployment } from '@/types/vercel-sdk';

const formatRelativeTime = (ts: number) => getTimeAgo(new Date(ts));

const truncate = (str: string, len: number) =>
  str.length > len ? `${str.slice(0, Math.max(0, len - 1))}…` : str;

const MAX_URL_LENGTH = 55;
const MAX_BRANCH_LENGTH = 30;

export const DeploymentListRow = ({
  deployment,
}: {
  deployment: Deployment;
}) => {
  const ctx = useCtx();
  const createdAt = getCreatedAt(deployment);
  const status = getStatusInfo(deployment, ctx.theme);
  const branch = getBranch(deployment);
  const commit = getCommit(deployment);
  const target = deployment.target;

  const [timeCol, statusCol, targetCol, urlCol, branchCol, commitCol] =
    columns as [
      Column, // time
      Column, // status
      Column, // target
      Column, // url
      Column, // branch
      Column, // commit
    ];

  return (
    <box flexDirection='row' gap={1} key={'header'} width='100%'>
      {/* Time */}
      <box style={getColumnStyle(timeCol)}>
        <text>{formatRelativeTime(createdAt)}</text>
      </box>

      {/* Status */}
      <box style={getColumnStyle(statusCol)}>
        <text fg={status.fg}>{status.label}</text>
      </box>

      {/* URL */}
      <box style={getColumnStyle(urlCol)}>
        <text>{truncate(deployment.url, urlCol.width ?? MAX_URL_LENGTH)}</text>
      </box>

      {/* Branch */}
      <box style={getColumnStyle(branchCol)}>
        <text>{truncate(branch, branchCol.width ?? MAX_BRANCH_LENGTH)}</text>
      </box>

      {/* Commit */}
      <box style={getColumnStyle(commitCol)}>
        <text>{commit}</text>
      </box>

      {/* Target */}
      <box style={getColumnStyle(targetCol)}>
        <text>{target || ''}</text>
      </box>
    </box>
  );
};
