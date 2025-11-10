import fs from 'node:fs';
import { useState } from 'react';

const PROJECT_CONFIG_PATH = '.vercel/project.json';

export type ProjectConfigState =
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

export function useProjectConfig() {
  const [state, setState] = useState<ProjectConfigState>(() =>
    readProjectConfig(),
  );

  const refresh = () => {
    setState(readProjectConfig());
  };

  return { state, refresh };
}
