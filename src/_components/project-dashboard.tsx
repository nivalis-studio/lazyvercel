import { useKeyboard } from '@opentui/react';
import { useMemo, useState } from 'react';
import { BranchList } from '@/_components/branch-list';
import { DeploymentsList } from '@/_components/deployments-list';
import { Loading } from '@/_components/loading';
import { StatusBar } from '@/_components/status-bar';
import { DEFAULT_BRANCH } from '@/constants';
import { useCtx } from '@/ctx';
import { useDeployments } from '@/hooks/use-deployments';
import { getBranchesList } from '@/lib/branches';
import { getDashboardKeyAction } from '@/lib/dashboard-keys';
import { getBranch } from '@/lib/extract-deploy-details';
import { DeploymentDetails } from './deployment-details';
import { DeploymentLogs } from './deployment-logs';
import type { Deployment } from '@/types/vercel-sdk';

const ProjectDashboardInner = ({
  projectId,
  modal,
}: {
  projectId: string;
  modal: unknown;
}) => {
  const { isLoading, isRefreshing, deployments, lastRefreshedAt, refresh } =
    useDeployments(projectId);
  const [selectedBranch, setSelectedBranch] = useState<string>(DEFAULT_BRANCH);
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);
  const [focused, setFocused] = useState(0);

  const branches = useMemo(() => {
    return getBranchesList(deployments);
  }, [deployments]);

  // Resolve the selected deployment against the polled list so details and
  // logs reflect fresh data (e.g. BUILDING -> READY). Fall back to the
  // snapshot if the deployment ages out of the list.
  const liveSelectedDeployment = selectedDeployment
    ? (deployments.find(d => d.uid === selectedDeployment.uid) ??
      selectedDeployment)
    : null;

  useKeyboard(key => {
    const action = getDashboardKeyAction(key, {
      modalOpen: modal !== null,
      canCycleBranch: selectedDeployment === null && branches.length > 0,
    });

    if (action === 'focus-previous' || action === 'focus-next') {
      const delta = action === 'focus-previous' ? -1 : 1;
      setFocused(prev => {
        const next = prev + delta;
        if (next < 0 || next > 1) {
          return prev;
        }
        return next;
      });
      return;
    }

    if (action === 'cycle-branch-next' || action === 'cycle-branch-previous') {
      const names = branches.map(([branch]) => branch);
      const step = action === 'cycle-branch-previous' ? -1 : 1;
      setSelectedBranch(prev => {
        const idx = Math.max(0, names.indexOf(prev));
        return names[(idx + step + names.length) % names.length] ?? prev;
      });
      return;
    }

    // Failures are stored on lastError for the Ctrl+E panel.
    if (action === 'refresh') {
      refresh();
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

  return (
    <box flexDirection='column' height='100%' width='100%'>
      <box flexDirection='row' flexGrow={1} minHeight={0} width='100%'>
        {liveSelectedDeployment ? (
          <>
            <DeploymentDetails
              deployment={liveSelectedDeployment}
              focused={isFocused(0)}
              getFocus={() => setFocused(0)}
              onDeploymentUnselect={onDeploymentUnselect}
            />
            <DeploymentLogs
              deployment={liveSelectedDeployment}
              focused={isFocused(1)}
              getFocus={() => setFocused(1)}
              onDeploymentUnselect={onDeploymentUnselect}
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </box>

      <StatusBar
        deploymentsCount={filteredDeployments.length}
        isRefreshing={isRefreshing}
        lastRefreshedAt={lastRefreshedAt}
        selectedBranch={selectedBranch}
        totalDeploymentsCount={deployments.length}
        view={selectedDeployment ? 'details' : 'list'}
      />
    </box>
  );
};

export const ProjectDashboard = () => {
  const { project, modal } = useCtx();

  if (!project) {
    return null;
  }

  return (
    <ProjectDashboardInner
      key={project.id}
      modal={modal}
      projectId={project.id}
    />
  );
};
