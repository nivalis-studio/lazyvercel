type DebugFn = (...args: Array<unknown>) => void;

const splitPatterns = (raw: string): Array<string> =>
  raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const matchPattern = (pattern: string, namespace: string) => {
  if (pattern === '*') {
    return true;
  }

  // Support a minimal wildcard at the end: "lazyvercel*" or "lazyvercel:*".
  if (pattern.endsWith('*')) {
    return namespace.startsWith(pattern.slice(0, -1));
  }

  // Exact match, or prefix match for child namespaces.
  return namespace === pattern || namespace.startsWith(`${pattern}:`);
};

export const createDebug = (namespace: string): DebugFn => {
  const patterns = splitPatterns(process.env.DEBUG ?? '');
  const enabled = patterns.some(p => matchPattern(p, namespace));

  if (!enabled) {
    return () => {
      /* noop */
    };
  }

  return (...args) => {
    // OpenTUI patches console, so this shows in the in-app console (Ctrl+K),
    // not on the process stderr. Fatal exits write stderr directly.
    console.error(`[${namespace}]`, ...args);
  };
};
