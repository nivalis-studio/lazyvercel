#!/usr/bin/env bun
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { useEffect, useState } from 'react';
import { Dashboard } from '@/_components/dashboard';
import { HelpPanel } from '@/_components/help';
import {
  MissingProjectId,
  MissingProjectPath,
} from '@/_components/missing-project';
import { ProjectSwitcher } from '@/_components/project-switcher';
import { Setup } from '@/_components/setup';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { hasConfig } from '@/lib/config';
import theme from '@/theme/catppuccin.json' with { type: 'json' };
import { resetVercelInstance } from '@/vercel';
import type { ReactNode } from 'react';
import type { Deployment } from '@/types/vercel-sdk';

const PROJECT_CONFIG_PATH = '.vercel/project.json';

type ProjectConfigState =
  | { status: 'missing_path' }
  | { status: 'missing_id' }
  | { status: 'ready'; projectId: string; teamId: string }
  | { status: 'error'; message: string };

const readProjectConfig = (): ProjectConfigState => {
  try {
    const contents = fs.readFileSync(PROJECT_CONFIG_PATH, 'utf8');
    const { projectId, orgId } = JSON.parse(contents) as {
      projectId?: string;
      orgId?: string;
    };

    if (projectId && orgId) {
      return { status: 'ready', projectId, teamId: orgId };
    }

    return { status: 'missing_id' };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code === 'ENOENT') {
      return { status: 'missing_path' };
    }

    console.error('Failed to read project config:', error);
    return { status: 'error', message: err.message };
  }
};

function useProjectConfig() {
  const [state, setState] = useState<ProjectConfigState>(() =>
    readProjectConfig(),
  );

  const refresh = () => {
    setState(readProjectConfig());
  };

  return { state, refresh };
}

const getCurrentBranch = (): string | undefined => {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return;
  }
};

const currentBranch = getCurrentBranch();

const renderer = await createCliRenderer({
  backgroundColor: theme.defs.darkCrust,
});

function App() {
  const [selectedBranchIndex, setSelectedBranchIndex] = useState<number>(0);
  const [selectedDeploymentIndex, setSelectedDeploymentIndex] =
    useState<number>(0);
  const [viewingDeployment, setViewingDeployment] = useState<
    Deployment | undefined
  >(undefined);
  const [isConfigured, setIsConfigured] = useState(hasConfig());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const { state: projectConfig, refresh: refreshProject } = useProjectConfig();
  const { showHelp, showProjectPicker, setShowProjectPicker } = useShortcuts({
    renderer,
    enabled: isConfigured,
  });
  const isProjectConfigReady = projectConfig.status === 'ready';

  useEffect(() => {
    if (!isProjectConfigReady) {
      setActiveProjectId(null);
      if (showProjectPicker) {
        setShowProjectPicker(false);
      }
    }
  }, [isProjectConfigReady, showProjectPicker, setShowProjectPicker]);

  if (!isConfigured) {
    return (
      <Setup
        onComplete={() => {
          resetVercelInstance();
          refreshProject();
          setIsConfigured(true);
        }}
      />
    );
  }

  const resolvedProjectId = isProjectConfigReady
    ? (activeProjectId ?? projectConfig.projectId)
    : undefined;

  const handleProjectSelect = (projectId: string) => {
    setActiveProjectId(projectId);
    setSelectedBranchIndex(0);
    setSelectedDeploymentIndex(0);
    setViewingDeployment(undefined);
  };

  let content: ReactNode = null;

  if (showHelp) {
    content = <HelpPanel />;
  } else {
    switch (projectConfig.status) {
      case 'missing_path':
        content = <MissingProjectPath />;
        break;
      case 'missing_id':
      case 'error':
        content = <MissingProjectId />;
        break;
      case 'ready':
        content = (
          <Dashboard
            currentBranch={currentBranch}
            projectId={resolvedProjectId ?? projectConfig.projectId}
            selectedBranchIndex={selectedBranchIndex}
            selectedDeploymentIndex={selectedDeploymentIndex}
            setSelectedBranchIndex={setSelectedBranchIndex}
            setSelectedDeploymentIndex={setSelectedDeploymentIndex}
            setViewingDeployment={setViewingDeployment}
            teamId={projectConfig.teamId}
            viewingDeployment={viewingDeployment}
          />
        );
        break;
      default:
        content = <MissingProjectPath />;
        break;
    }
  }

  return (
    <box
      flexDirection='column'
      flexGrow={1}
      style={{ position: 'relative', minHeight: 0 }}
    >
      {content}
      {showProjectPicker && isProjectConfigReady && resolvedProjectId ? (
        <ProjectSwitcher
          currentProjectId={resolvedProjectId}
          onClose={() => setShowProjectPicker(false)}
          onSelect={project => handleProjectSelect(project.id)}
          teamId={projectConfig.teamId}
        />
      ) : null}
    </box>
  );
}

createRoot(renderer).render(<App />);
