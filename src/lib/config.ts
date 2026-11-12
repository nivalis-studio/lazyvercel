import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import z from 'zod';
import { THEMES_MAP, type Theme, themeNameSchema, themeSchema } from './colors';

const configSchema = z.object({
  // Empty by default so first run always triggers Setup.
  bearerToken: z.string().default(''),
  theme: themeNameSchema.default('catppuccin'),
  customTheme: themeSchema.default(THEMES_MAP.catppuccin),
});

export type Config = z.infer<typeof configSchema>;

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.config', 'lazyvercel');

// Tests point this at a temp directory. Production keeps ~/.config/lazyvercel.
let configDir = DEFAULT_CONFIG_DIR;

const resolveConfigPath = (): string => path.join(configDir, 'config.json');

export const setConfigDirectory = (directory?: string): void => {
  configDir = directory ?? DEFAULT_CONFIG_DIR;
};

type LoadedConfig = {
  config: Config;
  loggedIn: boolean;
};

const DEFAULT_CONFIG: Config = {
  bearerToken: '',
  theme: 'catppuccin',
  customTheme: THEMES_MAP.catppuccin,
};

const saveConfig = (config: Config): void => {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(
    resolveConfigPath(),
    JSON.stringify(config, null, 2),
    'utf8',
  );
};

const backupCorruptConfig = (content: string): void => {
  const configPath = resolveConfigPath();
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${configPath}.bak-${ts}`;
    fs.renameSync(configPath, backupPath);
    fs.writeFileSync(backupPath, content, 'utf8');
  } catch {
    0;
  }
};

const loadConfig = async (): Promise<LoadedConfig> => {
  const configPath = resolveConfigPath();

  if (!fs.existsSync(configPath)) {
    saveConfig(DEFAULT_CONFIG);
    return { config: DEFAULT_CONFIG, loggedIn: false };
  }

  let content: string;
  try {
    content = fs.readFileSync(configPath, 'utf8');
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

  if (!config.bearerToken) {
    return { config, loggedIn: false };
  }

  // Unreachable: trust the saved token; dashboard API calls surface their own errors.
  const status = await checkToken(config.bearerToken);
  return { config, loggedIn: status !== 'invalid' };
};

export type TokenStatus = 'valid' | 'invalid' | 'unreachable';

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

export const checkToken = async (
  token: string,
  timeoutMs = 10_000,
): Promise<TokenStatus> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (response.ok) {
      return 'valid';
    }
    // Only an explicit auth rejection says the token is bad; 5xx/429/etc. do not.
    return response.status === HTTP_UNAUTHORIZED ||
      response.status === HTTP_FORBIDDEN
      ? 'invalid'
      : 'unreachable';
  } catch {
    // Offline, DNS failure, or timeout abort.
    return 'unreachable';
  } finally {
    clearTimeout(timeout);
  }
};

let _config: LoadedConfig = { config: DEFAULT_CONFIG, loggedIn: false };
let _initPromise: Promise<void> | undefined;

const init = () => {
  if (_initPromise) {
    return _initPromise;
  }

  _initPromise = loadConfig().then(result => {
    _config = result;
  });

  return _initPromise;
};

export const CONFIG = {
  init,
  get() {
    if (!_config.loggedIn) {
      throw new Error('Invalid or expired bearer token');
    }
    return _config.config;
  },
  getUnchecked() {
    return _config.config;
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
  // Write the file and patch memory. Pass `loggedIn` when the token status is
  // already known so the write does not check the token again.
  save(config: Config, options?: { loggedIn?: boolean }): void {
    saveConfig(config);
    _config = {
      config,
      loggedIn: options?.loggedIn ?? _config.loggedIn,
    };
  },
  // Re-reads the file and checks the token. Theme and setup saves must not
  // call this: a theme write is local, and setup already checked the token.
  async reload(): Promise<void> {
    _config = await loadConfig();
    _initPromise = Promise.resolve();
  },
};
