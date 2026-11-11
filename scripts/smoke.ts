#!/usr/bin/env bun
import { mkdir, mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Bun from 'bun';
import { SMOKE_ENV_VAR, SMOKE_OK_LINE } from '../src/lib/smoke';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UI_TIMEOUT_MS = 30_000;
const PACK_TIMEOUT_MS = 120_000;
const REAL_CONFIG_DIR = path.join(homedir(), '.config', 'lazyvercel');

type CommandResult = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
};

type RunCommandOptions = {
  readonly cmd: Array<string>;
  readonly cwd: string;
  readonly env: Record<string, string | undefined>;
  readonly timeoutMs: number;
};

const runCommand = async (
  options: RunCommandOptions,
): Promise<CommandResult> => {
  const proc = Bun.spawn(options.cmd, {
    cwd: options.cwd,
    env: options.env,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: options.timeoutMs,
  });

  const stdoutPromise = new Response(proc.stdout).text();
  const stderrPromise = new Response(proc.stderr).text();
  const [stdout, stderr, exitCode] = await Promise.all([
    stdoutPromise,
    stderrPromise,
    proc.exited,
  ]);

  return { exitCode, stdout, stderr };
};

const formatFailure = (label: string, result: CommandResult): string => {
  const parts = [`${label} failed (exit ${result.exitCode}).`];
  const stdout = result.stdout.trim();
  const stderr = result.stderr.trim();
  if (stdout.length > 0) {
    parts.push(`stdout:\n${stdout}`);
  }
  if (stderr.length > 0) {
    parts.push(`stderr:\n${stderr}`);
  }
  return parts.join('\n');
};

const assertExit = (label: string, result: CommandResult): void => {
  if (result.exitCode !== 0) {
    throw new Error(formatFailure(label, result));
  }
};

const pathExists = async (target: string): Promise<boolean> => {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
};

/** Fingerprint a directory so a write during the smoke run is visible. */
const fingerprintDir = async (dir: string): Promise<string> => {
  if (!(await pathExists(dir))) {
    return 'missing';
  }

  const names = (await readdir(dir)).sort();
  const parts = await Promise.all(
    names.map(async name => {
      const file = path.join(dir, name);
      const info = await stat(file);
      const body = info.isFile() ? await readFile(file) : Buffer.alloc(0);
      return `${name}:${info.size}:${body.toString('hex')}`;
    }),
  );
  return parts.join('\n');
};

const isolatedEnv = (
  home: string,
  smoke: boolean,
): Record<string, string | undefined> => {
  const env: Record<string, string | undefined> = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    XDG_CONFIG_HOME: path.join(home, '.config'),
  };

  if (smoke) {
    env[SMOKE_ENV_VAR] = '1';
    return env;
  }

  delete env[SMOKE_ENV_VAR];
  return env;
};

const assertConfigUntouched = async (
  home: string,
  label: string,
): Promise<void> => {
  const configDir = path.join(home, '.config', 'lazyvercel');
  if (await pathExists(configDir)) {
    throw new Error(
      `${label} created ${configDir}. The smoke path must exit before CONFIG.init.`,
    );
  }
};

const checkVersion = async (home: string): Promise<void> => {
  const pkg = JSON.parse(
    await readFile(path.join(ROOT, 'package.json'), 'utf8'),
  ) as { version?: string };
  const version = pkg.version ?? '';
  const result = await runCommand({
    cmd: ['bun', 'dist/index.js', '--version'],
    cwd: ROOT,
    env: isolatedEnv(home, false),
    timeoutMs: UI_TIMEOUT_MS,
  });
  assertExit('version check', result);

  const expectedPrefix = `lazyvercel/${version} `;
  if (!result.stdout.startsWith(expectedPrefix)) {
    throw new Error(
      `Built CLI printed '${result.stdout.trim()}', expected it to start with '${expectedPrefix}'.`,
    );
  }
  console.log('smoke: version ok');
};

const checkUi = async (
  home: string,
  cmd: Array<string>,
  label: string,
  cwd = ROOT,
): Promise<void> => {
  const result = await runCommand({
    cmd,
    cwd,
    env: isolatedEnv(home, true),
    timeoutMs: UI_TIMEOUT_MS,
  });
  assertExit(label, result);

  if (!result.stdout.includes(SMOKE_OK_LINE)) {
    throw new Error(
      `${label} exited 0 without printing '${SMOKE_OK_LINE}'.\n${formatFailure(label, result)}`,
    );
  }

  await assertConfigUntouched(home, label);
  console.log(`smoke: ${label} ok`);
};

const listTarball = async (tarball: string): Promise<Array<string>> => {
  const result = await runCommand({
    cmd: ['tar', '-tzf', tarball],
    cwd: ROOT,
    env: process.env,
    timeoutMs: UI_TIMEOUT_MS,
  });
  assertExit('tar -tzf', result);
  return result.stdout.split('\n').filter(line => line.length > 0);
};

const assertPackedFiles = (entries: ReadonlyArray<string>): void => {
  if (!entries.includes('package/dist/index.js')) {
    throw new Error('Packed tarball is missing package/dist/index.js.');
  }
  const leaked = entries.filter(entry => entry.startsWith('package/src/'));
  if (leaked.length > 0) {
    throw new Error(
      `Packed tarball includes source files:\n${leaked.join('\n')}`,
    );
  }
};

const checkPackedBin = async (home: string): Promise<void> => {
  const work = await mkdtemp(path.join(tmpdir(), 'lazyvercel-pack-'));
  try {
    // Pack the dist that already passed the bundle smoke. Ignore scripts so
    // prepack does not rebuild and prepare does not install git hooks.
    const tarball = path.join(work, 'lazyvercel.tgz');
    const packed = await runCommand({
      cmd: [
        'bun',
        'pm',
        'pack',
        '--filename',
        tarball,
        '--ignore-scripts',
        '--quiet',
      ],
      cwd: ROOT,
      env: process.env,
      timeoutMs: PACK_TIMEOUT_MS,
    });
    assertExit('bun pm pack', packed);
    assertPackedFiles(await listTarball(tarball));

    const appDir = path.join(work, 'app');
    await mkdir(appDir);
    const install = await runCommand({
      cmd: ['bun', 'add', '--ignore-scripts', tarball],
      cwd: appDir,
      env: process.env,
      timeoutMs: PACK_TIMEOUT_MS,
    });
    assertExit('bun add packed tarball', install);

    const bin = path.join(appDir, 'node_modules', '.bin', 'lazyvercel');
    if (!(await pathExists(bin))) {
      throw new Error(`Packed install did not link ${bin}.`);
    }

    await checkUi(home, [bin], 'packed bin', appDir);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
};

const main = async (): Promise<void> => {
  const dist = path.join(ROOT, 'dist', 'index.js');
  if (!(await pathExists(dist))) {
    throw new Error('dist/index.js is missing. Run `bun run build` first.');
  }

  const before = await fingerprintDir(REAL_CONFIG_DIR);
  const home = await mkdtemp(path.join(tmpdir(), 'lazyvercel-smoke-'));
  try {
    await checkVersion(home);
    await checkUi(home, ['bun', 'src/index.tsx'], 'source entry');
    await checkUi(home, ['bun', 'dist/index.js'], 'built bundle');
    await checkPackedBin(home);
  } finally {
    await rm(home, { recursive: true, force: true });
  }

  const after = await fingerprintDir(REAL_CONFIG_DIR);
  if (before !== after) {
    throw new Error(
      'Smoke run changed the real config directory. It must keep HOME temporary and exit before reading config.',
    );
  }
};

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
