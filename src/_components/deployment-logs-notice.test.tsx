import { afterEach, expect, mock, test } from 'bun:test';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { act } from 'react';
import { CtxProvider } from '@/ctx';
import { MAX_LOG_LINES } from '@/lib/log-buffer';
import { mountUi } from '@/lib/mount-ui';
import type { LogEvent } from '@/lib/log-events';
import type { Deployment } from '@/types/vercel-sdk';

const DROPPED_LINES = 12;
const SETTLE_MS = 30;

const noop = (): void => {
  // Mouse and unselect handlers are unused in this render.
};

mock.module('@/hooks/use-deployment-logs', () => ({
  useDeploymentLogs: (): {
    logs: Array<LogEvent>;
    loading: boolean;
    droppedCount: number;
  } => ({
    logs: [
      {
        id: 1,
        created: new Date(0),
        text: 'kept-line',
        type: 'stdout',
      },
    ],
    loading: false,
    droppedCount: DROPPED_LINES,
  }),
}));

const { DeploymentLogs } = await import('@/_components/deployment-logs');

const originalCwd = process.cwd();
const FRAME_WIDTH = 80;
const FRAME_HEIGHT = 16;

const deployment = {
  uid: 'dpl_notice',
  url: 'notice.vercel.app',
  created: 0,
  readyState: 'READY',
} as unknown as Deployment;

const linkProject = (): void => {
  const dir = mkdtempSync(path.join(tmpdir(), 'lazyvercel-notice-'));
  mkdirSync(path.join(dir, '.vercel'));
  writeFileSync(
    path.join(dir, '.vercel', 'project.json'),
    JSON.stringify({ projectId: 'prj_notice', orgId: 'team_notice' }),
  );
  process.chdir(dir);
};

afterEach(() => {
  process.chdir(originalCwd);
});

test('the log view says when earlier lines were dropped', async () => {
  linkProject();
  const view = await mountUi(
    renderer => (
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
    ),
    { width: FRAME_WIDTH, height: FRAME_HEIGHT },
  );

  try {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
    });
    await view.renderOnce();
    const frame = view.captureCharFrame();
    const capLabel = MAX_LOG_LINES.toLocaleString('en-US');
    expect(frame).toContain(`Showing the last ${capLabel} lines`);
    expect(frame).toContain(`${DROPPED_LINES} earlier omitted`);
    expect(frame).toContain('kept-line');
  } finally {
    await view.destroy();
    mock.restore();
  }
});
