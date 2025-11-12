import { useKeyboard } from '@opentui/react';
import { useState } from 'react';
import { useCtx } from '@/ctx';
import type { Deployment } from '@/types/vercel-sdk';

type Props = {
  focused: boolean;
  deployments: Array<Deployment>;
};

export const DeploymentsList = ({ focused, deployments }: Props) => {
  const [hoveredIdx, setHoveredIdx] = useState(0);
  const { getColor } = useCtx();

  useKeyboard(key => {
    if (!focused) {
      return;
    }

    if (key.name === 'down' || key.name === 'j') {
      setHoveredIdx(i => (i + 1) % deployments.length);
    }

    if (key.name === 'up' || key.name === 'k') {
      setHoveredIdx(i => (i - 1 + deployments.length) % deployments.length);
    }

    if (key.name === 'enter') {
      // biome-ignore lint/style/noNonNullAssertion: .
      const _deployment = deployments[hoveredIdx]!;
      // TODO: set content to deployment details
    }
  });
  return (
    <box
      borderColor={
        focused ? getColor('borderActive') : getColor('borderSubtle')
      }
      borderStyle='rounded'
      flexDirection='column'
      flexGrow={1}
      height='100%'
      padding={1}
      title='Deployments'
    >
      {null}
    </box>
  );
};
