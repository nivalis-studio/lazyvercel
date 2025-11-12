import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getThemeColor, type Theme } from '@/lib/colors';
import { getProjectConfig } from '@/lib/config';
import { fetchProjects as fetchProjects_ } from '@/lib/projects';
import theme from '@/theme/catppuccin.json' with { type: 'json' };
import type { CliRenderer } from '@opentui/core';
import type { Project, Projects } from '@/types/vercel-sdk';

type Ctx = {
  modal: ReactNode;
  setModal: (modal: ReactNode) => void;
  error: Error | null;
  projectId: string;
  setProjectId: (projectId: string) => void;
  projects: Projects | null;
  refreshProjects: () => Promise<void>;
  project: Project;
  teamId: string;
  _internal_theme: Theme;
  getColor: (color: keyof Theme['theme']) => string;
};

const ctx = createContext<Ctx | null>(null);

export const CtxProvider = ({
  children,
  renderer,
}: PropsWithChildren<{ renderer: CliRenderer }>) => {
  const getColor = getThemeColor(theme);
  renderer.setBackgroundColor(getColor('background'));
  const config = getProjectConfig();
  const [modal, setModal] = useState<ReactNode>(null);
  const [projectId, setProjectId] = useState(config.projectId);
  const [projects, setProjects] = useState<Projects | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const refreshProjects = useCallback(async () => {
    const projects_ = await fetchProjects_(config.teamId);
    setProjects(projects_);
  }, [config]);

  useEffect(() => {
    refreshProjects().catch(err => {
      setError(err instanceof Error ? err : new Error(String(err)));
    });
  }, [refreshProjects]);

  const ctx_ = {
    modal,
    setModal,
    projectId,
    setProjectId,
    teamId: config.teamId,
    projects,
    refreshProjects,
    error,
    getColor,
    _internal_theme: theme,
    // biome-ignore lint/style/noNonNullAssertion: Simpler typings, since in app we throw on undefined
    project: (projects ?? []).find(p => p.id === projectId)!,
  } satisfies Ctx;

  return <ctx.Provider value={ctx_}>{children}</ctx.Provider>;
};

export const useCtx = () => {
  const context = useContext(ctx);

  if (!context) {
    throw new Error('useCtx must be used within ctx provider');
  }

  return context;
};
