import { afterEach, expect, spyOn, test } from 'bun:test';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { act } from 'react';
import { DeploymentLogs } from '@/_components/deployment-logs';
import { CtxProvider } from '@/ctx';
import { THEMES_MAP } from '@/lib/colors';
import { CONFIG } from '@/lib/config';
import { mountUi } from '@/lib/mount-ui';
import type { CliRenderer } from '@opentui/core';
import type { Deployment } from '@/types/vercel-sdk';

const originalCwd = process.cwd();
const originalFetch = globalThis.fetch;
const FRAME_WIDTH = 80;
const FRAME_HEIGHT = 20;
const SETTLE_MS = 30;
const FRAME_ATTEMPTS = 8;
const CREATED = 1_700_000_000_000;
const WARN_CREATED = 1_700_000_001_000;

const noop = (): void => {
  // Mouse and unselect handlers are unused in this render.
};

const deployment = {
  uid: 'dpl_logs',
  url: 'logs.vercel.app',
  created: CREATED,
  readyState: 'READY',
} as unknown as Deployment;

const linkProject = (): void => {
  const dir = mkdtempSync(path.join(tmpdir(), 'lazyvercel-logs-'));
  mkdirSync(path.join(dir, '.vercel'));
  writeFileSync(
    path.join(dir, '.vercel', 'project.json'),
    JSON.stringify({ projectId: 'prj_logs', orgId: 'team_logs' }),
  );
  process.chdir(dir);
};

const settle = async (): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
  });
};

const LogsHarness = ({ renderer }: { renderer: CliRenderer }) => (
  <box flexDirection='column' height='100%' width='100%'>
    <CtxProvider renderer={renderer}>
      <DeploymentLogs
        deployment={deployment}
        focused={false}
        getFocus={noop}
        onDeploymentUnselect={noop}
      />
    </CtxProvider>
  </box>
);

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.chdir(originalCwd);
});

test('a short build renders every line and no omission notice', async () => {
  linkProject();
  const getConfig = spyOn(CONFIG, 'get').mockReturnValue({
    bearerToken: 'test-token',
    theme: 'catppuccin',
    customTheme: THEMES_MAP.catppuccin,
  });

  globalThis.fetch = ((input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('/v10/projects')) {
      return Promise.resolve(
        new Response(JSON.stringify({ projects: [] }), { status: 200 }),
      );
    }

    return Promise.resolve(
      new Response(
        JSON.stringify([
          { created: CREATED, text: 'hello-build', type: 'stdout' },
          {
            created: WARN_CREATED,
            text: 'warn-build',
            type: 'stderr',
            level: 'warning',
          },
        ]),
        { status: 200 },
      ),
    );
  }) as unknown as typeof fetch;

  const view = await mountUi(renderer => <LogsHarness renderer={renderer} />, {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  });

  try {
    const readFrame = async (attempt: number): Promise<string> => {
      await settle();
      await view.renderOnce();
      const frame = view.captureCharFrame();
      if (frame.includes('hello-build') || attempt >= FRAME_ATTEMPTS) {
        return frame;
      }
      return readFrame(attempt + 1);
    };
    const frame = await readFrame(1);

    expect(frame).toContain('hello-build');
    expect(frame).toContain('warn-build');
    expect(frame).not.toContain('earlier omitted');
    expect(frame).not.toContain('No build logs available');
  } finally {
    getConfig.mockRestore();
    await view.destroy();
  }
});
