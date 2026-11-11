import { useKeyboard } from '@opentui/react';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { CommandPanelModal } from '@/_components/command-panel';
import {
  MissingProjectId,
  MissingProjectPath,
} from '@/_components/missing-project';
import { getThemeColor, THEMES_MAP, type ThemeName } from '@/lib/colors';
import { CONFIG } from '@/lib/config';
import { fetchProjects as fetchProjects_ } from '@/lib/projects';
import { ProjectDashboard } from './_components/project-dashboard';
import {
  getCurrentProjectData,
  ProjectConfigError,
} from './lib/current-project';
import type { CliRenderer } from '@opentui/core';
import type { Ctx } from '@/types/ctx';
import type { Projects } from '@/types/vercel-sdk';
import type { Modal } from './types/modal';

const ctx = createContext<Ctx | null>(null);

const CtxProviderInner = ({
  children,
  renderer,
  projectId_,
  teamId,
}: PropsWithChildren<{
  renderer: CliRenderer;
  projectId_: string;
  teamId: string;
}>) => {
  const [theme, setTheme] = useState(CONFIG.getTheme());
  const getColor = getThemeColor(theme);
  renderer.setBackgroundColor(getColor('background'));

  const [content, setContent] = useState(<ProjectDashboard />);
  const [modal, setModal] = useState<Modal | null>(null);
  const [projectId, setProjectId] = useState(projectId_);
  const [projects, setProjects] = useState<Projects | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      const projects_ = await fetchProjects_(teamId);
      setProjects(projects_);
    } catch (err) {
      setLastError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [teamId]);

  useEffect(() => {
    refreshProjects().catch(err => {
      setLastError(err instanceof Error ? err : new Error(String(err)));
    });
  }, [refreshProjects]);

  const onSetTheme = useCallback((name: ThemeName, save = false): boolean => {
    if (save) {
      try {
        CONFIG.save({ ...CONFIG.getUnchecked(), theme: name });
      } catch (error) {
        const cause = error instanceof Error ? error : new Error(String(error));
        setLastError(new Error('Failed to save theme', { cause }));
        setTheme(CONFIG.getTheme());
        return false;
      }
    }

    const nextTheme =
      name === 'custom' ? CONFIG.getCustomTheme() : THEMES_MAP[name];
    setTheme(nextTheme);
    return true;
  }, []);

  const ctx_ = {
    content,
    setContent,
    modal,
    setModal,
    projectId,
    setProjectId: id => {
      setProjectId(id);
      setContent(<ProjectDashboard />);
    },
    teamId,
    projects,
    refreshProjects,
    lastError,
    setLastError,
    clearLastError: () => setLastError(null),
    getColor,
    setTheme: onSetTheme,
    project: (projects ?? []).find(p => p.id === projectId) ?? null,
    theme,
  } satisfies Ctx;

  useKeyboard(key => {
    if (key.ctrl && key.name === 'p') {
      setModal(CommandPanelModal);
      return;
    }

    if (key.ctrl && key.name === 'r') {
      refreshProjects().catch(err => {
        setLastError(err instanceof Error ? err : new Error(String(err)));
      });
      return;
    }

    if (key.ctrl && key.name === 'j') {
      renderer.console.show();
      renderer.console.focus();
      return;
    }
  });

  return <ctx.Provider value={ctx_}>{children}</ctx.Provider>;
};

export const CtxProvider = ({
  children,
  renderer,
}: PropsWithChildren<{ renderer: CliRenderer }>) => {
  let projectData: { projectId: string; teamId: string } | null = null;
  let projectError: Error | null = null;
  try {
    projectData = getCurrentProjectData();
  } catch (err) {
    projectError = err instanceof Error ? err : new Error(String(err));
  }

  if (!projectData) {
    const isInvalidJson =
      projectError instanceof ProjectConfigError &&
      projectError.code === 'invalid_json';
    return isInvalidJson ? <MissingProjectId /> : <MissingProjectPath />;
  }

  return (
    <CtxProviderInner
      projectId_={projectData.projectId}
      renderer={renderer}
      teamId={projectData.teamId}
    >
      {children}
    </CtxProviderInner>
  );
};

export const useCtx = () => {
  const context = useContext(ctx);

  if (!context) {
    throw new Error('useCtx must be used within ctx provider');
  }

  return context;
};
