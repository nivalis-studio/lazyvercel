#!/usr/bin/env bun
import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { useState } from 'react';
import { Setup } from '@/_components/setup';
import { ConfiguredApp } from '@/app';
import { CtxProvider, useCtx } from '@/ctx';
import { ErrorBoundary } from '@/error';
import { ExitProvider } from '@/exit';
import { getConfig } from '@/lib/config';
import { resetVercelInstance } from '@/vercel';

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
  const [isConfigured, setIsConfigured] = useState(Boolean(getConfig()));

  if (!isConfigured) {
    return (
      <Setup
        onComplete={() => {
          setIsConfigured(true);
          resetVercelInstance();
        }}
      />
    );
  }

  return (
    <box
      flexDirection='column'
      flexGrow={1}
      style={{ position: 'relative', minHeight: 0 }}
    >
      <ExitProvider>
        <CtxProvider renderer={renderer}>
          <Inner />
        </CtxProvider>
      </ExitProvider>
    </box>
  );
};

createRoot(renderer).render(<App_ />);
