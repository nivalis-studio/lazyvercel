import { type ScrollBoxRenderable, TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import open from 'open';
import { useRef } from 'react';
import { QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
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
