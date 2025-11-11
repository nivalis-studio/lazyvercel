import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getProjectConfig, type ProjectConfig } from './lib/config';
import { fetchProjects as fetchProjects_ } from './lib/projects';
import type { Project, Projects } from './types/vercel-sdk';

type Ctx = {
  setContent: (content: ReactNode) => void;
  setModal: (modal: ReactNode) => void;
  projectId: string;
  setProjectId: (projectId: string) => void;
  projects: Projects;
  refreshProjects: () => Promise<void>;
  project: Project | undefined;
  config: ProjectConfig;
};

const ctx = createContext<Ctx | null>(null);

export const ConfiguredApp = () => {
  const config = getProjectConfig();
  const [content, setContent] = useState<ReactNode>(null);
  const [modal, setModal] = useState<ReactNode>(null);
  const [projectId, setProjectId] = useState(config.projectId);
  const [projects, setProjects] = useState<Projects>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    const projects_ = await fetchProjects_(config);
    setProjects(projects_);
  }, [config]);

  useEffect(() => {
    fetchProjects().catch(err => {
      setError(err instanceof Error ? err : new Error(String(err)));
    });
  }, [fetchProjects]);

  if (error) {
    throw error;
  }

  const project = projects.find(p => p.id === projectId);

  const ctx_: Ctx = {
    setContent,
    projectId,
    setProjectId,
    setModal,
    config,
    projects,
    refreshProjects: fetchProjects,
    project,
  };

  return (
    <ctx.Provider value={ctx_}>
      <box
        flexDirection='column'
        flexGrow={1}
        style={{ position: 'relative', minHeight: 0 }}
      >
        {modal}
        {content}
      </box>
    </ctx.Provider>
  );
};

export const useCtx = () => {
  const context = useContext(ctx);

  if (!context) {
    throw new Error('useCtx must be used within ctx provider');
  }

  return context;
};
