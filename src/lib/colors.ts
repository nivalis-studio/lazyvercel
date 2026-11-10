import z from 'zod';
import aura from '@/theme/aura.json' with { type: 'json' };
import ayu from '@/theme/ayu.json' with { type: 'json' };
import catppuccin from '@/theme/catppuccin.json' with { type: 'json' };
import cobalt2 from '@/theme/cobalt2.json' with { type: 'json' };
import dracula from '@/theme/dracula.json' with { type: 'json' };
import everforest from '@/theme/everforest.json' with { type: 'json' };
import github from '@/theme/github.json' with { type: 'json' };
import gruvbox from '@/theme/gruvbox.json' with { type: 'json' };
import kanagawa from '@/theme/kanagawa.json' with { type: 'json' };
import material from '@/theme/material.json' with { type: 'json' };
import matrix from '@/theme/matrix.json' with { type: 'json' };
import monokai from '@/theme/monokai.json' with { type: 'json' };
import nightowl from '@/theme/nightowl.json' with { type: 'json' };
import nord from '@/theme/nord.json' with { type: 'json' };
import oneDark from '@/theme/one-dark.json' with { type: 'json' };
import opencode from '@/theme/opencode.json' with { type: 'json' };
import palenight from '@/theme/palenight.json' with { type: 'json' };
import rosepine from '@/theme/rosepine.json' with { type: 'json' };
import solarized from '@/theme/solarized.json' with { type: 'json' };
import synthwave84 from '@/theme/synthwave84.json' with { type: 'json' };
import tokyonight from '@/theme/tokyonight.json' with { type: 'json' };
import vesper from '@/theme/vesper.json' with { type: 'json' };
import zenburn from '@/theme/zenburn.json' with { type: 'json' };

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
    z.object({ dark: z.string(), light: z.string() }).or(z.string()),
  ),
});

export type Theme = z.infer<typeof themeSchema>;

export const THEMES_MAP = {
  aura: themeSchema.parse(aura),
  ayu: themeSchema.parse(ayu),
  catppuccin: themeSchema.parse(catppuccin),
  cobalt2: themeSchema.parse(cobalt2),
  dracula: themeSchema.parse(dracula),
  everforest: themeSchema.parse(everforest),
  github: themeSchema.parse(github),
  gruvbox: themeSchema.parse(gruvbox),
  kanagawa: themeSchema.parse(kanagawa),
  material: themeSchema.parse(material),
  matrix: themeSchema.parse(matrix),
  monokai: themeSchema.parse(monokai),
  nightowl: themeSchema.parse(nightowl),
  nord: themeSchema.parse(nord),
  oneDark: themeSchema.parse(oneDark),
  opencode: themeSchema.parse(opencode),
  palenight: themeSchema.parse(palenight),
  rosepine: themeSchema.parse(rosepine),
  solarized: themeSchema.parse(solarized),
  synthwave84: themeSchema.parse(synthwave84),
  tokyonight: themeSchema.parse(tokyonight),
  vesper: themeSchema.parse(vesper),
  zenburn: themeSchema.parse(zenburn),
} as const;

export const THEMES = [
  'custom',
  ...(Object.keys(THEMES_MAP) as Array<keyof typeof THEMES_MAP>),
] as const;

export const themeNameSchema = z.enum(THEMES);

export type ThemeName = (typeof THEMES)[number];

export const getThemeColor =
  (theme: Theme) =>
  (key: keyof Theme['theme']): string => {
    const val = theme.theme[key];
    const def = typeof val === 'string' ? val : val.dark;
    const isColor = def.startsWith('#');
    return isColor ? def : (theme.defs[def as keyof Theme['defs']] as string);
  };
