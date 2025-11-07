import { useKeyboard } from '@opentui/react';
import { useState } from 'react';
import type { CliRenderer } from '@opentui/core';

type Props = {
  renderer?: CliRenderer;
  enabled?: boolean;
};

export const useShortcuts = ({ renderer, enabled = true }: Props) => {
  const [showHelp, setShowHelp] = useState(false);

  useKeyboard(key => {
    if (!enabled) {
      return;
    }

    if (key.name === '?') {
      setShowHelp(prev => !prev);
      return;
    }

    if (showHelp && key.name === 'escape') {
      setShowHelp(false);
      return;
    }

    if (key.ctrl && key.name === 'k') {
      renderer?.console.toggle();
    }

    if (key.name === 'escape' || key.name === 'q') {
      process.exit(0);
    }
  });

  return {
    showHelp,
    setShowHelp,
  };
};
