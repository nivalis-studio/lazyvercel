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

const renderer = await createCliRenderer({
  backgroundColor: theme.defs.darkBase,
});

function App() {
  useKeyboard(key => {
    if (key.ctrl && key.name === 'k') {
      renderer?.console.toggle();
    }

    if (key.name === 'escape') {
      renderer?.destroy();
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

  return <Dashboard projectId={projectId} teamId={orgId} />;
}

createRoot(renderer).render(<App />);
