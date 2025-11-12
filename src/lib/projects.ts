import { getConfig } from '@/lib/config';
import { getToken } from '@/vercel';
import type { Project } from '@/types/vercel-sdk';

const MAX_PROJECTS = 150;

export const fetchProjects = async (teamId: string) => {
  const globalConfig = getConfig();
  if (!globalConfig?.bearerToken) {
    throw new Error('Bearer token not configured');
  }

  const url = 'https://api.vercel.com/v10/projects';
  const searchParams = new URLSearchParams({
    teamId,
    limit: MAX_PROJECTS.toString(),
  });

  const options = {
    method: 'GET',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: undefined,
  };

  const full = `${url}?${searchParams.toString()}`;
  const response = await fetch(full, options);

  if (!response.ok) {
    const cause = await response.json();
    throw new Error('Failed to fetch projects', { cause });
  }

  const data = (await response.json()) as { projects: Array<Project> };

  return data.projects;
};
