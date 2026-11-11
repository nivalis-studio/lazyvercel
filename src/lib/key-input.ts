export type ShortcutKey = {
  readonly name: string;
  readonly ctrl?: boolean;
  readonly meta?: boolean;
};

/**
 * Match a plain shortcut. Ctrl and Meta are reserved for app commands
 * (Ctrl+J / Ctrl+K console, Ctrl+R project refresh) and must not also
 * fire the unmodified binding.
 */
export const isUnmodifiedKey = (key: ShortcutKey, name: string): boolean => {
  if (key.ctrl || key.meta) {
    return false;
  }

  return key.name === name;
};
