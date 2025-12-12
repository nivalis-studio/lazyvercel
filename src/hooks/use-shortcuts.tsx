import { useKeyboard } from '@opentui/react';
import { useState } from 'react';
import { QUITTING_KEYS } from '@/constants';
import { gracefulExit } from '@/exit';
import type { CliRenderer } from '@opentui/core';

type Props = {
  renderer?: CliRenderer;
  enabled?: boolean;
};

export const useShortcuts = ({ renderer, enabled = true }: Props) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: okay-ish
  useKeyboard(key => {
    if (!enabled) {
      return;
    }

    const isProjectPickerShortcut =
      (key.meta || key.super || key.ctrl) && key.name === 'p';

    if (isProjectPickerShortcut) {
      setShowProjectPicker(prev => !prev);
      return;
    }

    if (showProjectPicker) {
      if (QUITTING_KEYS.includes(key.name)) {
        setShowProjectPicker(false);
        return;
      }

      // Block other global shortcuts while picker is visible.
      return;
    }

    if (key.name === '?') {
      setShowHelp(prev => !prev);
      return;
    }

    if (showHelp && (key.name === 'escape' || key.name === 'backspace')) {
      setShowHelp(false);
      return;
    }

    if (key.ctrl && key.name === 'k') {
      renderer?.console.toggle();
    }

    if (key.name === 'escape' || key.name === 'q') {
      gracefulExit(0, renderer);
    }
  });

  return {
    showHelp,
    setShowHelp,
    showProjectPicker,
    setShowProjectPicker,
  };
};
