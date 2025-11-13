import { useKeyboard } from '@opentui/react';
import {
  ScrollSelect,
  type ScrollSelectProps,
} from '@/_components/scroll-select';
import { MODAL_KEYS, QUITTING_KEYS } from '@/constants';
import type { Ctx } from '@/types/ctx';

const commands = [
  {
    key: 'project-switcher',
    name: 'Project Switcher',
  },
  {
    key: 'theme-switcher',
    name: 'Theme Switcher',
  },
] as const;

type CommandPanelItemProps = {
  ctx: Ctx;
  command: (typeof commands)[number];
} & Pick<ScrollSelectProps, 'onSelect'>;

const CommandPanelItem = ({ command, ctx }: CommandPanelItemProps) => {
  const { setModal } = ctx;

  return (
    <box padding={1}>
      <text>{command.name}</text>
    </box>
  );
};

type Props = {
  ctx: Ctx;
};

export const CommandPanel = ({ ctx }: Props) => {
  const { setModal, getColor, modal } = ctx;
  const isFocused = modal?.key === MODAL_KEYS.commandPanelKey;

  useKeyboard(key => {
    if (!isFocused) {
      return;
    }

    if (QUITTING_KEYS.includes(key.name)) {
      setModal(null);
    }
  });

  return (
    <box
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <scrollbox
        style={{
          width: '50%',
          maxWidth: 100,
          height: '40%',
          maxHeight: 35,
          backgroundColor: getColor('backgroundPanel'),
        }}
      >
        <ScrollSelect
          focused
          getFocus={() => null}
          onSelect={() => null}
          rows={commands.map(command => (
            <CommandPanelItem command={command} ctx={ctx} key={command.key} />
          ))}
          title='Command panel'
        />
      </scrollbox>
    </box>
  );
};
