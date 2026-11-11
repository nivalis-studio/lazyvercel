import { isUnmodifiedKey } from '@/lib/key-input';
import type { ShortcutKey } from '@/lib/key-input';

export type DashboardKey = ShortcutKey & {
  readonly shift?: boolean;
};

export type DashboardKeyState = {
  readonly modalOpen: boolean;
  readonly canCycleBranch: boolean;
};

export type DashboardKeyAction =
  | 'none'
  | 'focus-previous'
  | 'focus-next'
  | 'cycle-branch-next'
  | 'cycle-branch-previous'
  | 'refresh';

/**
 * Dashboard shortcuts. Letter keys ignore Ctrl and Meta, and nothing
 * here runs while a modal is open.
 */
export const getDashboardKeyAction = (
  key: DashboardKey,
  state: DashboardKeyState,
): DashboardKeyAction => {
  if (state.modalOpen) {
    return 'none';
  }

  if (key.name === 'left' || isUnmodifiedKey(key, 'h')) {
    return 'focus-previous';
  }

  if (key.name === 'right' || isUnmodifiedKey(key, 'l')) {
    return 'focus-next';
  }

  if (key.name === 'tab' && state.canCycleBranch) {
    return key.shift ? 'cycle-branch-previous' : 'cycle-branch-next';
  }

  if (isUnmodifiedKey(key, 'r')) {
    return 'refresh';
  }

  return 'none';
};
