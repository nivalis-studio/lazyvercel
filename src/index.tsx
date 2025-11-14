#!/usr/bin/env bun
import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { useState } from 'react';
import { Setup } from '@/_components/setup';
import { ConfiguredApp } from '@/app';
import { CtxProvider, useCtx } from '@/ctx';
import { ErrorBoundary } from '@/error';
import { ExitProvider } from '@/exit';
import { CONFIG } from '@/lib/config';

const renderer = await createCliRenderer();

const Inner = () => {
  const ctx = useCtx();
  return (
    <ErrorBoundary theme={ctx._internal_theme}>
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
