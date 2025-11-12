import { DeploymentsList } from '@/_components/deployments';
import { Loading } from '@/_components/loading';
import { LoadingProjectError } from '@/_components/missing-project';
import { useDeployments } from '@/hooks/use-deployments';
import { useProject } from '@/hooks/use-projects';
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
  const { deployments, refresh } = useDeployments(projectId);

  if (hasFailedProject) {
    return <LoadingProjectError />;
  }

  if (!(deployments && project)) {
    return <Loading />;
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
