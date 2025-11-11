import { exit } from 'node:process';
import { useKeyboard } from '@opentui/react';
import type { ReactNode } from 'react';

const EXIT_KEYS = ['q', 'Q'];

export const ExitProvider = ({ children }: { children: ReactNode }) => {
  useKeyboard(key => {
    if (EXIT_KEYS.includes(key.name)) {
      exit(0);
    }
  });

  return children;
};
