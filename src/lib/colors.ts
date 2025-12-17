import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import z from 'zod';

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

const runtimeDirname = (): string => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }

  return path.dirname(fileURLToPath(import.meta.url));
};

const readThemeJson = (filename: string): unknown => {
  const dir = runtimeDirname();
  const filePath = path.join(dir, '..', 'theme', filename);
  const contents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(contents) as unknown;
};

const loadTheme = (filename: string): Theme => {
  return themeSchema.parse(readThemeJson(filename));
};

const aura = loadTheme('aura.json');
const ayu = loadTheme('ayu.json');
const catppuccin = loadTheme('catppuccin.json');
const cobalt2 = loadTheme('cobalt2.json');
const dracula = loadTheme('dracula.json');
const everforest = loadTheme('everforest.json');
const github = loadTheme('github.json');
const gruvbox = loadTheme('gruvbox.json');
const kanagawa = loadTheme('kanagawa.json');
const material = loadTheme('material.json');
const matrix = loadTheme('matrix.json');
const monokai = loadTheme('monokai.json');
const nightowl = loadTheme('nightowl.json');
const nord = loadTheme('nord.json');
const oneDark = loadTheme('one-dark.json');
const opencode = loadTheme('opencode.json');
const palenight = loadTheme('palenight.json');
const rosepine = loadTheme('rosepine.json');
const solarized = loadTheme('solarized.json');
const synthwave84 = loadTheme('synthwave84.json');
const tokyonight = loadTheme('tokyonight.json');
const vesper = loadTheme('vesper.json');
const zenburn = loadTheme('zenburn.json');

export const THEMES_MAP = {
  aura,
  ayu,
  catppuccin,
  cobalt2,
  dracula,
  everforest,
  github,
  gruvbox,
  kanagawa,
  material,
  matrix,
  monokai,
  nightowl,
  nord,
  oneDark,
  opencode,
  palenight,
  rosepine,
  solarized,
  synthwave84,
  tokyonight,
  vesper,
  zenburn,
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
