import { afterEach, beforeEach, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getCurrentProjectData, ProjectConfigError } from './current-project';

const originalCwd = process.cwd();
let tmpDir = '';

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lazyvercel-test-'));
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const writeProjectJson = (content: string) => {
  fs.mkdirSync('.vercel');
  fs.writeFileSync(path.join('.vercel', 'project.json'), content, 'utf8');
};

const captureError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the function to throw');
};

test('getCurrentProjectData maps orgId to teamId and drops other keys', () => {
  writeProjectJson(
    JSON.stringify({ projectId: 'prj_123', orgId: 'team_456', settings: {} }),
  );

  expect(getCurrentProjectData()).toEqual({
    projectId: 'prj_123',
    teamId: 'team_456',
  });
});

test('getCurrentProjectData throws missing_path when the file does not exist', () => {
  const error = captureError(getCurrentProjectData);

  expect(error).toBeInstanceOf(ProjectConfigError);
  expect((error as ProjectConfigError).code).toBe('missing_path');
  expect((error as ProjectConfigError).name).toBe('ProjectConfigError');
  expect((error as ProjectConfigError).message).toBe(
    'Could not read the project config. Try running `vercel link`',
  );
  expect((error as ProjectConfigError).cause).toBeDefined();
});

test('getCurrentProjectData throws invalid_json on malformed JSON', () => {
  writeProjectJson('{not json');
  const error = captureError(getCurrentProjectData);

  expect(error).toBeInstanceOf(ProjectConfigError);
  expect((error as ProjectConfigError).code).toBe('invalid_json');
  expect((error as ProjectConfigError).message).toBe(
    'Error while parsing the project config. Try running `vercel link`',
  );
});

test('getCurrentProjectData throws invalid_json when orgId is missing', () => {
  writeProjectJson(JSON.stringify({ projectId: 'prj_123' }));
  const error = captureError(getCurrentProjectData);

  expect((error as ProjectConfigError).code).toBe('invalid_json');
});

test('getCurrentProjectData throws invalid_json when projectId is empty', () => {
  writeProjectJson(JSON.stringify({ projectId: '', orgId: 'team_456' }));
  const error = captureError(getCurrentProjectData);

  expect((error as ProjectConfigError).code).toBe('invalid_json');
});
