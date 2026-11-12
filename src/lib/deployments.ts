import z from 'zod';
import { CONFIG } from '@/lib/config';
import { createDebug } from '@/lib/debug';

const MAX_DEPLOYMENTS = 150;
// Path confirmed against the Vercel SDK 1.17.3 (deploymentsGetDeployments.ts).
const DEPLOYMENTS_URL = 'https://api.vercel.com/v6/deployments';

const errorBodySchema = z.object({ error: z.object({ message: z.string() }) });

const debug = createDebug('lazyvercel:deployments');

// Only the fields read somewhere in src/. Add a field here before reading it.
// States are plain strings, not enums, so a state Vercel adds later cannot
// fail the whole list.
const deploymentSchema = z.object({
  uid: z.string(),
  url: z.string(),
  created: z.number(),
  createdAt: z.number().optional(),
  readyState: z.string().optional(),
  state: z.string().optional(),
  target: z.string().nullish(),
  meta: z.record(z.string(), z.string()).optional(),
});

export const deploymentsResponseSchema = z.object({
  deployments: z.array(deploymentSchema),
});

export type Deployment = z.infer<typeof deploymentSchema>;
export type Deployments = Array<Deployment>;

export const fetchProjectDeployments = async (
  projectId: string,
  teamId: string,
): Promise<Deployments> => {
  const searchParams = new URLSearchParams({
    teamId,
    projectId,
    limit: MAX_DEPLOYMENTS.toString(),
  });

  const full = `${DEPLOYMENTS_URL}?${searchParams.toString()}`;
  debug('fetch', { teamId, projectId, url: full });

  const response = await fetch(full, {
    method: 'GET',
    headers: { Authorization: `Bearer ${CONFIG.get().bearerToken}` },
  });

  if (!response.ok) {
    // Error bodies are not always JSON (e.g. an HTML 502 from a proxy).
    const body: unknown = await response.json().catch(() => null);
    debug('fetch failed', { status: response.status, body });

    const apiMessage = errorBodySchema.safeParse(body).data?.error.message;
    const detail = apiMessage ? `: ${apiMessage}` : '';

    throw new Error(
      `Failed to fetch deployments (HTTP ${response.status})${detail}`,
      { cause: apiMessage },
    );
  }

  return deploymentsResponseSchema.parse(await response.json()).deployments;
};

export const isDeploymentBuilding = (deployment: Deployment) =>
  deployment.readyState === 'BUILDING' ||
  deployment.readyState === 'INITIALIZING' ||
  deployment.readyState === 'QUEUED' ||
  deployment.state === 'BUILDING' ||
  deployment.state === 'INITIALIZING' ||
  deployment.state === 'QUEUED';
