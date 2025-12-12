import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Vercel } from '@vercel/sdk';
import z from 'zod';
import { THEMES_MAP, type Theme, themeNameSchema, themeSchema } from './colors';

const configSchema = z.object({
  // Empty by default so first run always triggers Setup.
  bearerToken: z.string().default(''),
  theme: themeNameSchema.default('catppuccin'),
  customTheme: themeSchema.default(THEMES_MAP.catppuccin),
});

export type Config = z.infer<typeof configSchema>;

const CONFIG_DIR = path.join(os.homedir(), '.config', 'lazyvercel');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: Config = {
  bearerToken: '',
  theme: 'catppuccin',
  customTheme: THEMES_MAP.catppuccin,
};

const saveConfig = (config: Config) => {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
};

const backupCorruptConfig = (content: string) => {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${CONFIG_PATH}.bak-${ts}`;
    fs.renameSync(CONFIG_PATH, backupPath);
    fs.writeFileSync(backupPath, content, 'utf8');
  } catch {
  }
};

const loadConfig = async () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    saveConfig(DEFAULT_CONFIG);
    return { config: DEFAULT_CONFIG, loggedIn: false };
  }

  let content: string;
  try {
    content = fs.readFileSync(CONFIG_PATH, 'utf8');
  } catch (error) {
    throw new Error('Failed to read configuration file', { cause: error });
  }

  let config: Config;
  try {
    config = configSchema.parse(JSON.parse(content));
  } catch {
    backupCorruptConfig(content);
    saveConfig(DEFAULT_CONFIG);
    return { config: DEFAULT_CONFIG, loggedIn: false };
  }

  const isValid = config.bearerToken
    ? await validateToken(config.bearerToken)
    : false;

  return { config, loggedIn: isValid };
};

export const validateToken = async (
  token: string,
  timeoutMs = 10_000,
): Promise<boolean> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

let _config = await loadConfig();

export const CONFIG = {
  get() {
    if (!_config.loggedIn) {
      throw new Error('Invalid or expired bearer token');
    }
    return _config.config;
  },
  getUnchecked() {
    return _config.config;
  },
  getVercel() {
    if (!_config.loggedIn) {
      throw new Error('Invalid or expired bearer token');
    }

    return new Vercel({ bearerToken: _config.config.bearerToken });
  },
  getCustomTheme(): Theme {
    return _config.config.customTheme;
  },
  getTheme(): Theme {
    const theme = _config.config.theme;
    return theme === 'custom' ? this.getCustomTheme() : THEMES_MAP[theme];
  },
  isLoggedIn() {
    return _config.loggedIn;
  },
  save: saveConfig,
  async reload() {
    _config = await loadConfig();
  },
};
