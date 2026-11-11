/**
 * CI smoke gate. `scripts/smoke.ts` sets this to `1` so the CLI loads the UI
 * modules and exits before the renderer starts. Anything else is a normal run.
 */
export const SMOKE_ENV_VAR = 'LAZYVERCEL_SMOKE';

/** Printed on stdout once those modules have loaded. */
export const SMOKE_OK_LINE = 'lazyvercel smoke ok';

/** True when this process is the CI smoke check, not an interactive session. */
export const isSmokeRun = (): boolean => process.env[SMOKE_ENV_VAR] === '1';
