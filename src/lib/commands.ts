import { HelpModal } from '@/_components/help';
import { LastErrorModal } from '@/_components/last-error';
import { ProjectSwitcherModal } from '@/_components/project-switcher';
import { ThemeSwitcherModal } from '@/_components/theme-switcher';
import type { ParsedKey } from '@opentui/core';
import type { Ctx } from '@/types/ctx';

export type Command = {
  label: string;
  action: (ctx: Ctx) => void;
  keys?: Array<Partial<ParsedKey>>;
};

export const COMMANDS: Array<Command> = [
  {
    keys: [{ name: 'g', ctrl: true }],
    label: 'Project Switcher',
    action: ctx => {
      ctx.setModal(ProjectSwitcherModal);
    },
  },
  {
    label: 'Theme Switcher',
    action: ctx => {
      ctx.setModal(ThemeSwitcherModal);
    },
  },
  {
    // Kitty-protocol terminals (enabled by default in opentui) report
    // shift+/ as the base key with the typed '?' only in `sequence`;
    // legacy parsing yields name '?'. Match both.
    keys: [{ name: '?' }, { sequence: '?' }],
    label: 'Help',
    action: ctx => {
      ctx.setModal(ctx.modal?.key === HelpModal.key ? null : HelpModal);
    },
  },
  {
    keys: [{ name: 'e', ctrl: true }],
    label: 'Show Last Error',
    action: ctx => {
      ctx.setModal(LastErrorModal);
    },
  },
  {
    label: 'Clear Last Error',
    action: ctx => {
      ctx.clearLastError();
    },
  },
];
