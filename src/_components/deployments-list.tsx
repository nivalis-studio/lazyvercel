import { useKeyboard } from '@opentui/react';
import { useState } from 'react';
import { ScrollSelect, type ScrollSelectProps } from './scroll-select';
import { DeploymentListHeader } from './table/header';
import { DeploymentListRow } from './table/rows';
import type { Deployment } from '@/types/vercel-sdk';

type Props = {
  deployments: Array<Deployment>;
} & Pick<ScrollSelectProps, 'focused' | 'getFocus'>;

export const DeploymentsList = ({ focused, deployments, ...props }: Props) => {
  const [hoveredIdx, setHoveredIdx] = useState(0);

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
    <ScrollSelect
      header={<DeploymentListHeader />}
      rows={deployments.map(deployment => (
        <DeploymentListRow deployment={deployment} key={deployment.uid} />
      ))}
      title='Deployments'
      {...props}
      focused={focused}
      onSelect={selected => {
        console.debug({ selected });
      }}
    />
  );
};
