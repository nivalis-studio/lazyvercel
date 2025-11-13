import { useKeyboard } from '@opentui/react';
import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Panel } from '@/_components/panel';
import { getTheme, getThemeColor } from '@/lib/colors';
import { getProjectConfig } from '@/lib/config';
import { fetchProjects as fetchProjects_ } from '@/lib/projects';
import type { CliRenderer } from '@opentui/core';
import type { Ctx } from '@/types/ctx';
import type { Projects } from '@/types/vercel-sdk';

const ctx = createContext<Ctx | null>(null);

export const CtxProvider = ({
  children,
  renderer,
}: PropsWithChildren<{ renderer: CliRenderer }>) => {
  const theme = getTheme();
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

  useKeyboard(key => {
    if (key.name === 'p' && key.ctrl) {
      setModal(<Panel ctx={ctx_} />);
    }
  });

  return <ctx.Provider value={ctx_}>{children}</ctx.Provider>;
};

export const useCtx = () => {
  const context = useContext(ctx);

  if (!context) {
    throw new Error('useCtx must be used within ctx provider');
  }

  return context;
};
