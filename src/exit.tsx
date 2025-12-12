import { exit } from 'node:process';
import { useKeyboard, useRenderer } from '@opentui/react';
import type { CliRenderer } from '@opentui/core';
import type { ReactNode } from 'react';

export const gracefulExit = (code = 0, renderer?: CliRenderer) => {
  try {
    renderer?.console?.hide?.();
    (renderer as unknown as { destroy?: () => void })?.destroy?.();
  } catch {
    // Ignore cleanup errors.
  }
  exit(code);
};

export const ExitProvider = ({ children }: { children: ReactNode }) => {
  const renderer = useRenderer();
  useKeyboard(key => {
    if (key.name === 'q' && key.shift) {
      gracefulExit(0, renderer);
    }

    if (key.name === 'c' && key.ctrl) {
      gracefulExit(0, renderer);
    }

    if (key.name === 'k' && key.ctrl) {
      renderer.console.toggle();
    }
  });

  return children;
};
