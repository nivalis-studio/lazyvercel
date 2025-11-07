import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { useState } from 'react';
import { Dashboard } from '@/_components/dashboard';
import { HelpPanel } from '@/_components/help';
import {
  MissingProjectId,
  MissingProjectPath,
} from '@/_components/missing-project';
import { Setup } from '@/_components/setup';
import { hasConfig } from '@/lib/config';
import theme from '@/theme/catppuccin.json' with { type: 'json' };
import { resetVercelInstance } from '@/vercel';
import { useShortcuts } from './hooks/use-shortcuts';

const projectPath = fs.existsSync('.vercel/project.json')
  ? '.vercel/project.json'
  : null;

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
  backgroundColor: theme.defs.darkBase,
});

function App() {
  const [isConfigured, setIsConfigured] = useState(hasConfig());
  const { showHelp } = useShortcuts({ renderer, enabled: isConfigured });

  if (!isConfigured) {
    return (
      <Setup
        onComplete={() => {
          resetVercelInstance();
          setIsConfigured(true);
        }}
      />
    );
  }

  if (showHelp) {
    return <HelpPanel />;
  }

  if (!projectPath) {
    return <MissingProjectPath />;
  }

  const { projectId, orgId } = JSON.parse(
    fs.readFileSync(projectPath, 'utf8'),
  ) as { projectId: string; orgId: string };

  if (!(projectId && orgId)) {
    return <MissingProjectId />;
  }

  return (
    <Dashboard
      currentBranch={currentBranch}
      projectId={projectId}
      teamId={orgId}
    />
  );
}

createRoot(renderer).render(<App />);
