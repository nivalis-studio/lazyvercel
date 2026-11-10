import { useKeyboard } from '@opentui/react';
import { useState } from 'react';
import { QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
import { gracefulExit } from '@/exit';
import { openUrl } from '@/lib/open-url';
import { ScrollSelect, type ScrollSelectProps } from './scroll-select';
import { DeploymentListHeader } from './table/header';
import { DeploymentListRow } from './table/rows';
import type { Deployment } from '@/types/vercel-sdk';

type Props = {
  deployments: Array<Deployment>;
  onDeploymentSelect: (deployment: Deployment) => void;
} & Pick<ScrollSelectProps, 'focused' | 'getFocus'>;

export const DeploymentsList = ({
  focused,
  deployments,
  onDeploymentSelect,
  ...props
}: Props) => {
  const { setLastError } = useCtx();
  const [hoveredIdx, setHoveredIdx] = useState(0);

  useKeyboard(key => {
    if (!focused) {
      return;
    }

    if (key.name === 'o') {
      const url = deployments[hoveredIdx]?.url;

      if (url) {
        openUrl(url, setLastError);
      }
      return;
    }

    if (QUITTING_KEYS.includes(key.name)) {
      gracefulExit(0);
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
      onHover={setHoveredIdx}
      onSelect={selected => {
        const deployment = deployments[selected];

        if (!deployment) {
          return;
        }

        onDeploymentSelect(deployment);
      }}
    />
  );
};
