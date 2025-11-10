#!/usr/bin/env bun
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
import { useProjectConfig } from './hooks/use-config';
import { getCurrentBranch } from './lib/current-branch';
import type { ReactNode } from 'react';
import type { Deployment } from '@/types/vercel-sdk';

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
