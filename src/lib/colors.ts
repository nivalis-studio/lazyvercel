import z from 'zod';
import defaultTheme from '@/theme/catppuccin.json' with { type: 'json' };
import { getConfig } from './config';

const THEME_KEYS = [
  'primary',
  'secondary',
  'accent',
  'error',
  'warning',
  'success',
  'info',
  'text',
  'textMuted',
  'background',
  'backgroundPanel',
  'backgroundElement',
  'border',
  'borderActive',
  'borderSubtle',
  'diffAdded',
  'diffRemoved',
  'diffContext',
  'diffHunkHeader',
  'diffHighlightAdded',
  'diffHighlightRemoved',
  'diffAddedBg',
  'diffRemovedBg',
  'diffContextBg',
  'diffLineNumber',
  'diffAddedLineNumberBg',
  'diffRemovedLineNumberBg',
  'markdownText',
  'markdownHeading',
  'markdownLink',
  'markdownLinkText',
  'markdownCode',
  'markdownBlockQuote',
  'markdownEmph',
  'markdownStrong',
  'markdownHorizontalRule',
  'markdownListItem',
  'markdownListEnumeration',
  'markdownImage',
  'markdownImageText',
  'markdownCodeBlock',
  'syntaxComment',
  'syntaxKeyword',
  'syntaxFunction',
  'syntaxVariable',
  'syntaxString',
  'syntaxNumber',
  'syntaxType',
  'syntaxOperator',
  'syntaxPunctuation',
] as const;

export const themeSchema = z.object({
  defs: z.record(z.string(), z.string()),
  theme: z.record(
    z.enum(THEME_KEYS),
    z.object({ dark: z.string(), light: z.string() }),
  ),
});

export type Theme = z.infer<typeof themeSchema>;

export const getThemeColor =
  (theme: Theme) =>
  (key: keyof Theme['theme']): string => {
    const def = theme.theme[key].dark;

    const isColor = def.startsWith('#');
    return isColor ? def : (theme.defs[def as keyof Theme['defs']] as string);
  };

export const getTheme = () => {
  const config = getConfig();

  return config?.theme ?? defaultTheme;
};
