import { DEFAULT_BRANCH } from '@/constants';
import { getBranch, getCreatedAt } from '@/lib/extract-deploy-details';
import type { Deployment } from '@/types/vercel-sdk';

export const getBranchesList = (
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
