import { useCallback, useEffect, useState } from 'react';
import { getConfig } from '@/lib/config';
import type { Project, Projects } from '@/types/vercel-sdk';

type Props = {
  teamId: string;
  projectId: string;
};

const MAX_PROJECTS = 150;

export const useProjects = ({ teamId }: { teamId: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);
  const [projects, setProjects] = useState<Projects>([]);

  const fetchProjects = useCallback(async () => {
    const config = getConfig();
    if (!config?.bearerToken) {
      throw new Error('Bearer token not configured');
    }
    const url = 'https://api.vercel.com/v10/projects';

    const searchParams = new URLSearchParams({
      teamId,
      limit: MAX_PROJECTS.toString(),
    });

    const options = {
      method: 'GET',
      headers: { Authorization: 'Bearer IvVbJk3kr093EKVc9khegVvE' },
      body: undefined,
    };

    const full = `${url}?${searchParams.toString()}`;

    const response = await fetch(full, options);
    const data = (await response.json()) as { projects: Array<Project> };
    setProjects(data.projects);
    setIsLoading(false);
    setHasFailed(false);
  }, [teamId]);

  useEffect(() => {
    fetchProjects().catch(() => {
      /* */
    });
  }, [fetchProjects]);

  return { isLoading, projects, hasFailed, refresh: fetchProjects };
};

export const useProject = ({ projectId, teamId }: Props) => {
  const { isLoading, projects, hasFailed, refresh } = useProjects({ teamId });

  const project = projects.find(prject => prject.id === projectId);

  return { isLoading, project, hasFailed, refresh };
};
