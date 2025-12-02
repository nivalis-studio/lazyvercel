import { CONFIG } from './config';
import type { Deployment } from '@/types/vercel-sdk';

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

export const isDeploymentBuilding = (deployment: Deployment) =>
  deployment.readyState === 'BUILDING' ||
  deployment.readyState === 'INITIALIZING' ||
  deployment.readyState === 'QUEUED' ||
  deployment.state === 'BUILDING' ||
  deployment.state === 'INITIALIZING' ||
  deployment.state === 'QUEUED';
