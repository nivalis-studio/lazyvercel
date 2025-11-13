import { useKeyboard } from '@opentui/react';
import { ScrollSelect } from '@/_components/scroll-select';
import { MODAL_KEYS, QUITTING_KEYS } from '@/constants';
import { ProjectSwitcher } from './project-switcher';
import type { Ctx } from '@/types/ctx';

type Command = {
  key: string;
  label: string;
  action: (ctx: Ctx) => void;
};

const COMMANDS: Array<Command> = [
  {
    key: 'project-switcher',
    label: 'Project Switcher',
    action: ctx => {
      ctx.setModal({
        children: <ProjectSwitcher />,
        key: 'project-switcher',
      });
    },
  },
  {
    key: 'theme-switcher',
    label: 'Theme Switcher',
    action: ctx => {
      ctx.setModal({
        children: (
          <box>
            <text>theme switcher</text>
          </box>
        ),
        key: 'theme-switcher',
      });
    },
  },
];

type CommandPanelItemProps = {
  command: Command;
};

const CommandPanelItem = ({ command }: CommandPanelItemProps) => {
  return (
    <box>
      <text>{command.label}</text>
    </box>
  );
};

type Props = {
  ctx: Ctx;
};

export const CommandPanel = ({ ctx }: Props) => {
  const { setModal, modal } = ctx;
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
    <ScrollSelect
      focused
      getFocus={() => null}
      onSelect={idx => COMMANDS[idx]?.action(ctx) ?? null}
      rows={COMMANDS.map(command => (
        <CommandPanelItem command={command} key={command.key} />
      ))}
      title='Command panel'
    />
  );
};
