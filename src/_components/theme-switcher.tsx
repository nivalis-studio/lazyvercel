import { useKeyboard } from '@opentui/react';
import { useEffect, useRef } from 'react';
import { QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
import { THEMES } from '@/lib/colors';
import { CONFIG } from '@/lib/config';
import { ScrollSelect } from './scroll-select';
import type { Modal } from '@/types/modal';

const ThemeSwitcher = () => {
  const { setTheme, setModal, getColor } = useCtx();
  const hasSavedRef = useRef(false);
  const current = CONFIG.getUnchecked().theme;

  // Hover previews a theme in React state only. Leaving by any route
  // (quit, ?, Ctrl+E, Ctrl+P, Ctrl+G) restores the saved theme unless
  // this select just persisted it.
  useEffect(() => {
    return () => {
      if (hasSavedRef.current) {
        return;
      }

      setTheme(CONFIG.getUnchecked().theme);
    };
  }, [setTheme]);

  const onHover = (idx: number) => {
    const selected = THEMES[idx];

    if (!selected) {
      return;
    }

    setTheme(selected);
  };

  const onSelect = (idx: number) => {
    const selected = THEMES[idx];

    if (!selected) {
      return;
    }

    if (!setTheme(selected, true)) {
      return;
    }

    hasSavedRef.current = true;
    setModal(null);
  };

  useKeyboard(key => {
    if (QUITTING_KEYS.includes(key.name)) {
      setModal(null);
    }
  });

  return (
    <ScrollSelect
      onHover={onHover}
      onSelect={onSelect}
      rows={THEMES.map(name => (
        <box flexDirection='row' gap={1} key={name}>
          {current === name && <text fg={getColor('accent')}>*</text>}
          <text>{name}</text>
        </box>
      ))}
      title='Switch theme'
    />
  );
};

export const ThemeSwitcherModal: Modal = {
  children: ThemeSwitcher,
  key: 'theme-switcher',
} as const;
