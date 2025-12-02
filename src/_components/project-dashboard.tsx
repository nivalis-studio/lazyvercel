import { useKeyboard } from '@opentui/react';
import { useMemo, useState } from 'react';
import { BranchList } from '@/_components/branch-list';
import { DeploymentsList } from '@/_components/deployments-list';
import { Loading } from '@/_components/loading';
import { DEFAULT_BRANCH } from '@/constants';
import { useCtx } from '@/ctx';
import { useDeployments } from '@/hooks/use-deployments';
import { getBranch, getCreatedAt } from '@/lib/extract-deploy-details';
import { DeploymentDetails } from './deployment-details';
import { DeploymentLogs } from './deployment-logs';
import type { Deployment } from '@/types/vercel-sdk';

const getBranchesList = (
  deployments: Array<Deployment>,
): Array<[string, Deployment]> => {
  const map = new Map<string, Deployment>();
  let lastDeployment: Deployment | undefined;

  for (const deployment of deployments) {
    const branch = getBranch(deployment);

    if (!branch) {
      continue;
    }

    const createdAt = getCreatedAt(deployment);

    const latest = map.get(branch);

    if (!lastDeployment || createdAt > getCreatedAt(lastDeployment)) {
      lastDeployment = deployment;
    }

    if (!latest || createdAt > getCreatedAt(latest)) {
      map.set(branch, deployment);
    }
  }

  const sortedBranches = Array.from(map.entries()).sort(
    ([bA, depA], [bB, depB]) =>
      getCreatedAt(depB) - getCreatedAt(depA) || bA.localeCompare(bB),
  );

  if (!lastDeployment) {
    return sortedBranches;
  }

  return [[DEFAULT_BRANCH, lastDeployment], ...sortedBranches];
};

export const ProjectDashboard = () => {
  const { project, modal } = useCtx();
  const { isLoading, deployments } = useDeployments(project.id);
  const [selectedBranch, setSelectedBranch] = useState<string>(DEFAULT_BRANCH);
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);
  const [focused, setFocused] = useState(0);

  const branches = useMemo(() => {
    return getBranchesList(deployments);
  }, [deployments]);

  useKeyboard(key => {
    if (key.name === 'left' || key.name === 'h') {
      setFocused(prev => (prev > 0 ? prev - 1 : prev));
    }

    if (key.name === 'right' || key.name === 'l') {
      setFocused(prev => (prev < 1 ? prev + 1 : prev));
    }
  });

  const onBranchSelect = (branch: string) => {
    setSelectedBranch(branch);
    setFocused(1);
  };

  const onDeploymentSelect = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setFocused(1);
  };

  const onDeploymentUnselect = () => {
    setSelectedDeployment(null);
    setFocused(1);
  };

  if (isLoading) {
    return <Loading label='Loading deployments...' />;
  }

  const filteredDeployments =
    selectedBranch === DEFAULT_BRANCH
      ? deployments
      : deployments.filter(d => getBranch(d) === selectedBranch);

  const hasModal = modal !== null;
  const isFocused = (key: 0 | 1) => (hasModal ? false : key === focused);

  // TODO: add bottom hint for horizontal navigation
  return (
    <>
      {selectedDeployment ? (
        <box flexDirection='row' height='100%' width='100%'>
          <DeploymentDetails
            deployment={selectedDeployment}
            focused={isFocused(0)}
            getFocus={() => setFocused(0)}
            onDeploymentUnselect={onDeploymentUnselect}
          />
          <DeploymentLogs
            deployment={selectedDeployment}
            focused={isFocused(1)}
            getFocus={() => setFocused(1)}
            onDeploymentUnselect={onDeploymentUnselect}
          />
        </box>
      ) : (
        <box flexDirection='row' height='100%' width='100%'>
          <BranchList
            branches={branches}
            focused={isFocused(0)}
            getFocus={() => setFocused(0)}
            onSelectBranch={onBranchSelect}
            selectedBranch={selectedBranch}
          />
          <DeploymentsList
            deployments={filteredDeployments}
            focused={isFocused(1)}
            getFocus={() => setFocused(1)}
            onDeploymentSelect={onDeploymentSelect}
          />
        </box>
      )}
    </>
  );
};
