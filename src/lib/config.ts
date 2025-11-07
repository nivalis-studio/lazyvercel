import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type Config = {
  bearerToken: string;
};

const CONFIG_DIR = path.join(os.homedir(), '.config', 'lazyvercel');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export const getConfig = (): Config | null => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return null;
    }
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(content) as Config;
  } catch (error) {
    console.error('Failed to read config:', error);
    return null;
  }
};

export const saveConfig = (config: Config): void => {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save config:', error);
    throw error;
  }
};

export const hasConfig = (): boolean => {
  return fs.existsSync(CONFIG_PATH);
};
