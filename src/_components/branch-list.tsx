import { useKeyboard } from '@opentui/react';
import open from 'open';
import {
  ScrollSelect,
  type ScrollSelectProps,
} from '@/_components/scroll-select';
import { DEFAULT_BRANCH } from '@/constants';
import { useCtx } from '@/ctx';
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
  selectedBranch,
  onSelectBranch,
  ...props
}: Props) => {
  const { getColor, ...ctx } = useCtx();

  useKeyboard(key => {
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

    if (key.name === 'space') {
      /* TODO: behave like pressing Enter and select branch */
    }
  });

  return (
    <ScrollSelect
      {...props}
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

        const { icon, fg } = getStatusInfo(lastDeployment, ctx._internal_theme);

        return (
          <box flexDirection='row' gap={1} key={branch} width='100%'>
            {isSelected ? (
              <text fg={getColor('primary')} flexShrink={0}>
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
