import { useKeyboard } from '@opentui/react';
import { QUITTING_KEYS } from '@/constants';
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
  useKeyboard(key => {
    if (!focused) {
      return;
    }

    if (QUITTING_KEYS.includes(key.name)) {
      process.exit(0);
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
        const deployment = deployments[selected];

        if (!deployment) {
          return;
        }

        onDeploymentSelect(deployment);
      }}
    />
  );
};
