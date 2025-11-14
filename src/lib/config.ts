import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import z from 'zod';
import { themeNameSchema, themeSchema } from './colors';

const configSchema = z.object({
  bearerToken: z.string().min(1),
  theme: z.union([themeSchema, themeNameSchema]).optional(),
});

export type Config = z.infer<typeof configSchema>;

const CONFIG_DIR = path.join(os.homedir(), '.config', 'lazyvercel');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const loadConfig = async () => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return null;
    }
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = configSchema.parse(JSON.parse(content) as Config);

    const isValid = await validateToken(config.bearerToken);

    if (!isValid) {
      return null;
    }

    return config;
  } catch {
    return null;
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
    if (!_config) {
      throw new Error(
        'Config not initialized - this should only be called after isConfigReady() returns true',
      );
    }
    return _config;
  },
  get_nullable() {
    return _config;
  },
  get isReady() {
    return _config !== null;
  },
  async reload() {
    _config = await loadConfig();
  },
};

export const saveConfig = async (config: Config) => {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    await CONFIG.reload();
  } catch (error) {
    console.error('Failed to save config:', error);
    throw error;
  }
};
