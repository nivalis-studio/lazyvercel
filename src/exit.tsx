import { exit, stderr } from 'node:process';
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

/**
 * Exit after a fatal error, making sure the error reaches the real terminal.
 *
 * The renderer patches the global console (and stdout), so `console.error`
 * ends up in an in-memory overlay that is destroyed on exit. Instead, destroy
 * the renderer first (restoring the terminal), then write to the real stderr,
 * which opentui never patches.
 */
export const fatalExit = (
  label: string,
  error: unknown,
  renderer?: CliRenderer,
) => {
  try {
    renderer?.console?.hide?.();
    (renderer as unknown as { destroy?: () => void })?.destroy?.();
  } catch {
    // Ignore cleanup errors.
  }
  const details =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  stderr.write(`${label}: ${details}\n`);
  exit(1);
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
