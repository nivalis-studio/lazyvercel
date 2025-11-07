import { useDeployments } from '@/hooks/use-deployments';
import { useProject } from '@/hooks/use-projects';
import { DeploymentsList } from './deployments';
import { LoadingState } from './loading';
import {
  LoadingDeploymentsError,
  LoadingProjectError,
} from './missing-project';
import type { Deployment } from '@/types/vercel-sdk';

type Props = {
  teamId: string;
  projectId: string;
  currentBranch?: string;
  selectedBranchIndex: number;
  setSelectedBranchIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedDeploymentIndex: number;
  setSelectedDeploymentIndex: React.Dispatch<React.SetStateAction<number>>;
  viewingDeployment: Deployment | undefined;
  setViewingDeployment: React.Dispatch<
    React.SetStateAction<Deployment | undefined>
  >;
};

export const Dashboard = ({
  teamId,
  projectId,
  currentBranch,
  ...rest
}: Props) => {
  const { hasFailed: hasFailedProject, project } = useProject({
    teamId,
    projectId,
  });
  const {
    hasFailed: hasFailedDeployments,
    deployments,
    refresh,
  } = useDeployments({
    teamId,
    projectId,
  });

  if (hasFailedProject) {
    return <LoadingProjectError />;
  }

  if (hasFailedDeployments) {
    return <LoadingDeploymentsError />;
  }

  if (!(deployments && project)) {
    return <LoadingState project={project} />;
  }

  return (
    <DeploymentsList
      currentBranch={currentBranch}
      deployments={deployments}
      project={project}
      refresh={refresh}
      teamId={teamId}
      {...rest}
    />
  );
};
