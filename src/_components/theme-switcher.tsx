import { useKeyboard } from '@opentui/react';
import { QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
import { THEMES } from '@/lib/colors';
import { CONFIG } from '@/lib/config';
import { ScrollSelect } from './scroll-select';
import type { Modal } from '@/types/modal';

const ThemeSwitcher = () => {
  const { setTheme, setModal, getColor } = useCtx();

  const current = CONFIG.get().theme;

  const onHover = (idx: number) => {
    const selected = THEMES[idx];

    if (!selected) {
      return;
    }

    setTheme(selected);
  };

  const onSelect = async (idx: number) => {
    const selected = THEMES[idx];

    if (!selected) {
      return;
    }

    await setTheme(selected, true);
    setModal(null);
  };

  useKeyboard(key => {
    if (QUITTING_KEYS.includes(key.name)) {
      setTheme(CONFIG.get().theme);
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
