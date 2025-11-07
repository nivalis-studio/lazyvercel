import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createCliRenderer } from '@opentui/core';
import { createRoot, useKeyboard } from '@opentui/react';
import {
  MissingProjectId,
  MissingProjectPath,
} from '@/_components/missing-project';
import theme from '@/theme/catppuccin.json' with { type: 'json' };
import { Dashboard } from './_components/dashboard';

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
  useKeyboard(key => {
    if (key.ctrl && key.name === 'k') {
      renderer?.console.toggle();
    }

    if (key.name === 'escape' || key.name === 'q') {
      process.exit(0);
    }
  });

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
