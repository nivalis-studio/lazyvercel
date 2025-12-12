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

export class ProjectConfigError extends Error {
  code: 'missing_path' | 'invalid_json';

  constructor(
    code: ProjectConfigError['code'],
    message: string,
    cause?: unknown,
  ) {
    super(message, cause ? { cause } : undefined);
    this.name = 'ProjectConfigError';
    this.code = code;
  }
}

export const getCurrentProjectData = (): ProjectConfig => {
  let content: string;

  try {
    content = fs.readFileSync(PROJECT_CONFIG_PATH, 'utf8');
  } catch (error) {
    throw new ProjectConfigError(
      'missing_path',
      'Could not read the project config. Try running `vercel link`',
      error,
    );
  }

  try {
    return projectDataSchema.parse(JSON.parse(content));
  } catch (error) {
    throw new ProjectConfigError(
      'invalid_json',
      'Error while parsing the project config. Try running `vercel link`',
      error,
    );
  }
};
