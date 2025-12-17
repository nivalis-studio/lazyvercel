#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Bun from 'bun';
import { cac } from 'cac';

const aliasRegex = /^@\//;

const registerPathAliases = () => {
  if (typeof Bun === 'undefined' || !Bun.plugin) {
    return;
  }

  const globalAny = globalThis as unknown as {
    __lazyvercelAliasesRegistered?: boolean;
  };

  if (globalAny.__lazyvercelAliasesRegistered) {
    return;
  }
  globalAny.__lazyvercelAliasesRegistered = true;

  const distRoot = path.dirname(fileURLToPath(import.meta.url));

  Bun.plugin({
    name: 'lazyvercel-tsconfig-paths',
    setup(build) {
      build.onResolve({ filter: aliasRegex }, args => {
        const subpath = args.path.slice(2);

        const direct = path.join(distRoot, `${subpath}.js`);
        if (fs.existsSync(direct)) {
          return { path: direct };
        }

        const index = path.join(distRoot, subpath, 'index.js');
        if (fs.existsSync(index)) {
          return { path: index };
        }

        return { path: direct };
      });
    },
  });
};

registerPathAliases();

type CliOptions = {
  cwd?: string;
  debug?: boolean | string;
};

const readPackageVersion = (): string => {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      version?: string;
    };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
};

const resolveCwd = (cwdArg?: string, cwdFlag?: string): string | undefined => {
  const cwd = cwdFlag ?? cwdArg;
  if (!cwd) {
    return;
  }

  const resolved = path.resolve(cwd);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory does not exist: ${resolved}`);
  }

  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${resolved}`);
  }

  return resolved;
};

const setDebugEnv = (debug: CliOptions['debug']) => {
  if (debug === undefined) {
    return;
  }

  if (debug === true) {
    process.env.DEBUG = 'lazyvercel*';
    return;
  }

  const raw = String(debug).trim();
  if (raw.length === 0) {
    process.env.DEBUG = 'lazyvercel*';
    return;
  }

  process.env.DEBUG = raw;
};

const startUi = async () => {
  const { createCliRenderer } = await import('@opentui/core');
  const { createRoot } = await import('@opentui/react');
  const { useState } = await import('react');

  const { Setup } = await import('@/_components/setup');
  const { ConfiguredApp } = await import('@/app');
  const { CtxProvider, useCtx } = await import('@/ctx');
  const { ErrorBoundary } = await import('@/error');
  const { ExitProvider, gracefulExit } = await import('@/exit');
  const { CONFIG } = await import('@/lib/config');

  await CONFIG.init();

  const renderer = await createCliRenderer();

  process.on('unhandledRejection', reason => {
    console.error('Unhandled rejection:', reason);
    gracefulExit(1, renderer);
  });
  process.on('uncaughtException', err => {
    console.error('Uncaught exception:', err);
    gracefulExit(1, renderer);
  });

  const Inner = () => {
    const ctx = useCtx();
    return (
      <ErrorBoundary theme={ctx.theme}>
        <ConfiguredApp />
      </ErrorBoundary>
    );
  };

  const App_ = () => {
    const [isConfigured, setIsConfigured] = useState(CONFIG.isLoggedIn());

    const onComplete = () => {
      setIsConfigured(CONFIG.isLoggedIn());
    };

    return (
      <box
        flexDirection='column'
        flexGrow={1}
        style={{ position: 'relative', minHeight: 0 }}
      >
        <ExitProvider>
          {isConfigured ? (
            <CtxProvider renderer={renderer}>
              <Inner />
            </CtxProvider>
          ) : (
            <Setup onComplete={onComplete} />
          )}
        </ExitProvider>
      </box>
    );
  };

  createRoot(renderer).render(<App_ />);
};

const cli = cac('lazyvercel');

cli.option('--cwd <dir>', 'Run as if launched in <dir>');
cli.option(
  '--debug [namespaces]',
  'Enable debug logs (sets DEBUG, default: lazyvercel*)',
);

cli
  .command('[cwd]', 'Launch the LazyVercel TUI')
  .example('lazyvercel')
  .example('lazyvercel .')
  .example('lazyvercel --cwd ../my-vercel-project')
  .example('lazyvercel --debug')
  .example('lazyvercel --debug lazyvercel*')
  .action(async (cwdArg: string | undefined, options: CliOptions) => {
    setDebugEnv(options.debug);

    const cwd = resolveCwd(cwdArg, options.cwd);
    if (cwd) {
      process.chdir(cwd);
    }

    await startUi();
  });

cli.on('command:*', () => {
  console.error(`Unknown command: ${cli.args.join(' ')}`);
  cli.outputHelp();
  process.exit(1);
});

cli.help();
cli.version(readPackageVersion(), '-v, --version');

const run = async () => {
  cli.parse(process.argv, { run: false });
  await cli.runMatchedCommand();
};

run().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
