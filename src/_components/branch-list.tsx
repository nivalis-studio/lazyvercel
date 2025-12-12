import { useKeyboard } from '@opentui/react';
import open from 'open';
import {
  ScrollSelect,
  type ScrollSelectProps,
} from '@/_components/scroll-select';
import { DEFAULT_BRANCH, QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
import { gracefulExit } from '@/exit';
import { getCreatedAt, getStatusInfo } from '@/lib/extract-deploy-details';
import { getTimeAgo } from '@/lib/time-ago';
import type { Deployment } from '@/types/vercel-sdk';

const MAX_TIME_CHARS = 3;

type Props = {
  branches: Array<[string, Deployment]>;
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
} & Pick<ScrollSelectProps, 'focused' | 'getFocus'>;

export const BranchList = ({
  branches,
  focused,
  selectedBranch,
  onSelectBranch,
  ...props
}: Props) => {
  const { getColor, ...ctx } = useCtx();

  useKeyboard(key => {
    if (!focused) {
      return;
    }

    if (key.name === 'o') {
      let url = `https://vercel.com/${ctx.teamId}/${ctx.project.name}/`;

      if (selectedBranch && selectedBranch !== DEFAULT_BRANCH) {
        url += `deployments?catchAll=deployments&filterBranch=${selectedBranch}`;
      }

      open(url).catch(error => {
        console.error('Failed to open URL:', error);
      });

      return;
    }

    if (QUITTING_KEYS.includes(key.name)) {
      gracefulExit(0);
    }
  });

  return (
    <ScrollSelect
      {...props}
      focused={focused}
      onSelect={idx => {
        const branch = branches[idx]?.at(0);

        if (!branch) {
          return;
        }

        onSelectBranch(branch as string);
      }}
      rows={branches.map(([branch, lastDeployment]) => {
        const isSelected = branch === selectedBranch;
        const relativeTime = getTimeAgo(getCreatedAt(lastDeployment), {
          short: true,
        });

        const { icon, fg } = getStatusInfo(lastDeployment, ctx.theme);

        return (
          <box flexDirection='row' gap={1} key={branch} width='100%'>
            {isSelected ? (
              <text fg={getColor('accent')} flexShrink={0}>
                {'  '}*
              </text>
            ) : (
              <text fg={getColor('primary')} flexShrink={0}>
                {relativeTime.length < MAX_TIME_CHARS && ' '}
                {relativeTime}
              </text>
            )}
            <text fg={fg} flexShrink={0}>
              {icon}
            </text>
            <text wrapMode='none'>{branch}</text>
          </box>
        );
      })}
      title='Branches'
      width='25%'
    />
  );
};
