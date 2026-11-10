import { expect, test } from 'bun:test';
import { getThemeColor, THEMES_MAP } from './colors';

const BUNDLED_THEME_COUNT = 23;

test('THEMES_MAP contains all 23 bundled themes', () => {
  expect(Object.keys(THEMES_MAP)).toHaveLength(BUNDLED_THEME_COUNT);
});

test('every bundled theme resolves background to a hex color', () => {
  for (const theme of Object.values(THEMES_MAP)) {
    expect(getThemeColor(theme)('background')).toStartWith('#');
  }
});
