import { afterEach, expect, spyOn, test } from 'bun:test';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { act, memo, useState } from 'react';
import { DeploymentListRow } from '@/_components/table/rows';
import { CtxProvider, useCtx } from '@/ctx';
// biome-ignore lint/performance/noNamespaceImport: spyOn patches this live export
import * as deployDetails from '@/lib/extract-deploy-details';
import { mountUi } from '@/lib/mount-ui';
import type { CliRenderer } from '@opentui/core';
import type { Modal } from '@/types/modal';
import type { Deployment } from '@/types/vercel-sdk';

const originalCwd = process.cwd();
const FRAME_WIDTH = 120;
const FRAME_HEIGHT = 16;
const SETTLE_MS = 30;

const deployment = {
  uid: 'dpl_render',
  url: 'demo.vercel.app',
  created: 1_700_000_000_000,
  readyState: 'READY',
} as unknown as Deployment;

const testModal: Modal = {
  key: 'test-modal',
  children: () => null,
};

const linkProject = (): void => {
  const dir = mkdtempSync(path.join(tmpdir(), 'lazyvercel-'));
  mkdirSync(path.join(dir, '.vercel'));
  writeFileSync(
    path.join(dir, '.vercel', 'project.json'),
    JSON.stringify({ projectId: 'prj_render', orgId: 'team_render' }),
  );
  process.chdir(dir);
};

const settle = async (): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
  });
};

let contextRenders = 0;
let bumpNonce: (() => void) | null = null;
let openModal: ((modal: Modal | null) => void) | null = null;
let changeTheme: ((name: 'nord') => boolean) | null = null;

const ContextProbe = memo(function ContextValueProbe() {
  useCtx();
  contextRenders += 1;
  return <text>context-probe</text>;
});

const RowHost = () => {
  const { setModal, setTheme } = useCtx();
  openModal = setModal;
  changeTheme = setTheme;
  return <DeploymentListRow deployment={deployment} />;
};

const Harness = ({ renderer }: { renderer: CliRenderer }) => {
  const [nonce, setNonce] = useState(1);
  bumpNonce = () => setNonce(current => current + 1);

  return (
    <box flexDirection='column' height='100%' width='100%'>
      <text>nonce-{nonce}</text>
      <CtxProvider renderer={renderer}>
        <ContextProbe />
        <RowHost />
      </CtxProvider>
    </box>
  );
};

const mount = async () => {
  linkProject();
  contextRenders = 0;
  const statusSpy = spyOn(deployDetails, 'getStatusInfo');
  const view = await mountUi(renderer => <Harness renderer={renderer} />, {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  });
  await settle();
  await view.renderOnce();

  return { statusSpy, view };
};

afterEach(() => {
  process.chdir(originalCwd);
});

test('context value keeps its identity across renders when nothing changed', async () => {
  const mounted = await mount();

  try {
    const frame = mounted.view.captureCharFrame();
    expect(frame).toContain('context-probe');
    expect(contextRenders).toBeGreaterThan(0);

    const rendersBefore = contextRenders;
    await act(() => {
      bumpNonce?.();
    });
    await settle();
    await mounted.view.renderOnce();

    expect(mounted.view.captureCharFrame()).toContain('nonce-2');
    expect(contextRenders).toBe(rendersBefore);
  } finally {
    mounted.statusSpy.mockRestore();
    await mounted.view.destroy();
  }
});

test('opening and closing a modal does not re-render deployment rows', async () => {
  const mounted = await mount();
  const { statusSpy } = mounted;

  try {
    expect(statusSpy.mock.calls.length).toBeGreaterThan(0);
    const rendersBefore = statusSpy.mock.calls.length;

    if (!(openModal && changeTheme)) {
      throw new Error('row host did not register controls');
    }

    await act(() => {
      openModal?.(testModal);
    });
    await settle();
    expect(statusSpy.mock.calls.length).toBe(rendersBefore);

    await act(() => {
      openModal?.(null);
    });
    await settle();
    expect(statusSpy.mock.calls.length).toBe(rendersBefore);

    await act(() => {
      changeTheme?.('nord');
    });
    await settle();
    expect(statusSpy.mock.calls.length).toBeGreaterThan(rendersBefore);
  } finally {
    statusSpy.mockRestore();
    await mounted.view.destroy();
  }
});
