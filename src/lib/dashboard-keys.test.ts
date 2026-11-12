import { expect, test } from 'bun:test';
import { getDashboardKeyAction } from './dashboard-keys';
import type { DashboardKey, DashboardKeyState } from './dashboard-keys';

const closed: DashboardKeyState = {
  modalOpen: false,
  canCycleBranch: true,
};

const modalOpen: DashboardKeyState = {
  modalOpen: true,
  canCycleBranch: true,
};

const key = (
  name: string,
  modifiers: Partial<DashboardKey> = {},
): DashboardKey => {
  return { name, ...modifiers };
};

test('plain r refreshes and Ctrl+R / Meta+R do not', () => {
  expect(getDashboardKeyAction(key('r'), closed)).toBe('refresh');
  expect(getDashboardKeyAction(key('r', { ctrl: true }), closed)).toBe('none');
  expect(getDashboardKeyAction(key('r', { meta: true }), closed)).toBe('none');
});

test('h/l move focus and ignore Ctrl and Meta; arrows stay directional', () => {
  expect(getDashboardKeyAction(key('h'), closed)).toBe('focus-previous');
  expect(getDashboardKeyAction(key('l'), closed)).toBe('focus-next');
  expect(getDashboardKeyAction(key('h', { ctrl: true }), closed)).toBe('none');
  expect(getDashboardKeyAction(key('l', { meta: true }), closed)).toBe('none');
  expect(getDashboardKeyAction(key('left', { ctrl: true }), closed)).toBe(
    'focus-previous',
  );
  expect(getDashboardKeyAction(key('right'), closed)).toBe('focus-next');
});

test('arrow keys and letters do nothing while a modal is open', () => {
  for (const name of ['left', 'right', 'h', 'l', 'tab', 'r']) {
    expect(getDashboardKeyAction(key(name), modalOpen)).toBe('none');
  }
});

test('tab cycles the branch filter only when the list can cycle', () => {
  expect(getDashboardKeyAction(key('tab'), closed)).toBe('cycle-branch-next');
  expect(getDashboardKeyAction(key('tab', { shift: true }), closed)).toBe(
    'cycle-branch-previous',
  );
  expect(
    getDashboardKeyAction(key('tab'), {
      modalOpen: false,
      canCycleBranch: false,
    }),
  ).toBe('none');
});
