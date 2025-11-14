import fs from 'node:fs';
import z from 'zod';

const PROJECT_CONFIG_PATH = '.vercel/project.json';

const projectDataSchema = z
  .object({
    projectId: z.string().min(1),
    orgId: z.string().min(1),
  })
  .transform(val => ({ projectId: val.projectId, teamId: val.orgId }));

export type ProjectConfig = z.infer<typeof projectDataSchema>;

export const getCurrentProjectData = () => {
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
    const projectConfig = projectDataSchema.parse(JSON.parse(content));

    return projectConfig;
  } catch (error) {
    throw new Error(
      'Error while parsing the project config. Try running `vercel link`',
      { cause: error },
    );
  }
};
