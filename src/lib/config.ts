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
const PROJECT_CONFIG_PATH = '.vercel/project.json';

export const getConfig = (): Config | null => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return null;
    }
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = configSchema.parse(JSON.parse(content) as Config);

    return config;
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

const projectConfigSchema = z
  .object({
    projectId: z.string().min(1),
    orgId: z.string().min(1),
  })
  .transform(val => ({ projectId: val.projectId, teamId: val.orgId }));

export type ProjectConfig = z.infer<typeof projectConfigSchema>;

export const getProjectConfig = () => {
  let content: string;

  try {
    content = fs.readFileSync(PROJECT_CONFIG_PATH, 'utf8');
  } catch (error) {
    throw new Error(
      'Could not read the project config. Try running `vercel link`',
      { cause: error },
    );
  }

  try {
    const projectConfig = projectConfigSchema.parse(JSON.parse(content));

    return projectConfig;
  } catch (error) {
    throw new Error(
      'Error while parsing the project config. Try running `vercel link`',
      { cause: error },
    );
  }
};
