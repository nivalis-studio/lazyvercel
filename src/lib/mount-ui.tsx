import { createTestRenderer } from '@opentui/core/testing';
import { createRoot } from '@opentui/react';
import { act, type ReactNode } from 'react';
import type { CliRenderer } from '@opentui/core';

type ActGlobals = typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

const actGlobals = globalThis as ActGlobals;

export type MountedUi = {
  captureCharFrame: () => string;
  renderOnce: () => Promise<void>;
  destroy: () => Promise<void>;
};

type MountOptions = {
  width: number;
  height: number;
};

export const mountUi = async (
  renderNode: (renderer: CliRenderer) => ReactNode,
  options: MountOptions,
): Promise<MountedUi> => {
  const previous = actGlobals.IS_REACT_ACT_ENVIRONMENT;
  actGlobals.IS_REACT_ACT_ENVIRONMENT = true;
  const view = await createTestRenderer(options);
  const root = createRoot(view.renderer);

  await act(async () => {
    root.render(renderNode(view.renderer));
    // Effects that reject on the next turn (project refresh) commit here,
    // instead of warning once this act has returned.
    await Promise.resolve();
    await Promise.resolve();
  });

  return {
    captureCharFrame: () => view.captureCharFrame(),
    renderOnce: () => view.renderOnce(),
    destroy: async () => {
      try {
        await act(() => {
          root.unmount();
        });
        view.renderer.destroy();
      } finally {
        actGlobals.IS_REACT_ACT_ENVIRONMENT = previous;
      }
    },
  };
};
