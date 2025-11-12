import themeJSON from '@/theme/catppuccin.json' with { type: 'json' };

export type Theme = typeof themeJSON;

export const getThemeColor =
  (theme: Theme) =>
  (key: keyof Theme['theme']): string => {
    const def = theme.theme[key].dark as keyof Theme['defs'];
    return theme.defs[def];
  };
