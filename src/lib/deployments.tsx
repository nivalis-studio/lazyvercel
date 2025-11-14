import { CONFIG } from './config';

const MAX_DEPLOYMENTS = 150;

export const fetchProjectDeployments = async (
  projectId: string,
  teamId: string,
) => {
  const vercel = CONFIG.getVercel();

  const data = await vercel.deployments.getDeployments({
    teamId,
    projectId,
    limit: MAX_DEPLOYMENTS,
  });

  return data.deployments;
};
