import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
import type { Modal } from '@/types/modal';

type Shortcut = [keys: string, description: string];

const SECTIONS: Array<[title: string, shortcuts: Array<Shortcut>]> = [
  [
    'Global',
    [
      ['?', 'Toggle this help'],
      ['Ctrl+P', 'Open command palette'],
      ['Ctrl+G', 'Switch project'],
      ['Ctrl+E', 'Show last error'],
      ['Ctrl+R', 'Refresh projects'],
      ['Ctrl+K', 'Toggle console'],
      ['Shift+Q / Ctrl+C', 'Quit'],
    ],
  ],
  [
    'Dashboard',
    [
      ['← / → or h / l', 'Switch pane focus'],
      ['r', 'Refresh deployments'],
    ],
  ],
  [
    'Branch & deployments lists',
    [
      ['↑ / ↓ or j / k', 'Move selection'],
      ['ENTER / SPACE', 'Select branch / open deployment'],
      ['o', 'Open branch deployment in browser'],
      ['q / ESC / BACKSPACE', 'Quit'],
    ],
  ],
  [
    'Deployment details / logs',
    [
      ['o', 'Open deployment in browser'],
      ['q / ESC / BACKSPACE', 'Back to list'],
    ],
  ],
];

const HelpPanel = () => {
  const { getColor, setModal } = useCtx();

  useKeyboard(key => {
    if (QUITTING_KEYS.includes(key.name)) {
      setModal(null);
    }
  });

  return (
    <box flexDirection='column' gap={1} padding={1} width='100%'>
      {SECTIONS.map(([title, shortcuts]) => (
        <box flexDirection='column' key={title}>
          <text attributes={TextAttributes.BOLD} fg={getColor('text')}>
            {title}
          </text>
          {shortcuts.map(([keys, description]) => (
            <box flexDirection='row' key={keys}>
              <box width={22}>
                <text fg={getColor('secondary')}>{keys}</text>
              </box>
              <text fg={getColor('textMuted')}>{description}</text>
            </box>
          ))}
        </box>
      ))}

      <text attributes={TextAttributes.DIM} fg={getColor('textMuted')}>
        Press ?, Q, ESC or BACKSPACE to close
      </text>
    </box>
  );
};

export const HelpModal: Modal = {
  children: HelpPanel,
  key: 'help',
} as const;
