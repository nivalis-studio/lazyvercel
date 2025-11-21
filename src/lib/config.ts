import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Vercel } from '@vercel/sdk';
import z from 'zod';
import { THEMES_MAP, type Theme, themeNameSchema, themeSchema } from './colors';

const configSchema = z.object({
  bearerToken: z.string().default('myVercelToken'),
  theme: themeNameSchema.default('catppuccin'),
  customTheme: themeSchema.default(THEMES_MAP.catppuccin),
});

export type Config = z.infer<typeof configSchema>;

const CONFIG_DIR = path.join(os.homedir(), '.config', 'lazyvercel');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: Config = {
  bearerToken: 'myVercelToken',
  theme: 'catppuccin',
  customTheme: THEMES_MAP.catppuccin,
};

const saveConfig = (config: Config) => {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
};

const loadConfig = async () => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      throw new Error("Config file doesn't exist");
    }
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = configSchema.parse(JSON.parse(content));

    const isValid = await validateToken(config.bearerToken);

    if (!isValid) {
      return { config, loggedIn: false };
    }

    return { config, loggedIn: true };
  } catch {
    saveConfig(DEFAULT_CONFIG);

    return { config: DEFAULT_CONFIG, loggedIn: false };
  }
};

export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
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
  get_uncheked() {
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
