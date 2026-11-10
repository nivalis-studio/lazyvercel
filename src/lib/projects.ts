import z from 'zod';
import { CONFIG } from '@/lib/config';
import { createDebug } from '@/lib/debug';
import type { Project } from '@/types/vercel-sdk';

const PROJECTS_URL = 'https://api.vercel.com/v10/projects';
// Page size we ask for. The API's maximum is undocumented; the server may
// return fewer and pagination covers the rest.
const PAGE_SIZE = 150;
// Hard cap (20 x 150 = 3000 projects) so a cursor that never ends cannot loop
// forever; raise it if a real team exceeds it.
export const MAX_PROJECT_PAGES = 20;

const errorBodySchema = z.object({ error: z.object({ message: z.string() }) });

type ProjectsPage = {
  projects: Array<Project>;
  pagination?: { next?: number | string | null };
};

const debug = createDebug('lazyvercel:projects');

export const fetchProjectsWithToken = async (
  teamId: string,
  token: string,
): Promise<Array<Project>> => {
  const projects: Array<Project> = [];
  let from: string | undefined;

  for (let page = 0; page < MAX_PROJECT_PAGES; page++) {
    const searchParams = new URLSearchParams({
      teamId,
      limit: PAGE_SIZE.toString(),
    });
    if (from !== undefined) {
      searchParams.set('from', from);
    }

    const full = `${PROJECTS_URL}?${searchParams.toString()}`;
    debug('fetch', { teamId, url: full });
    // biome-ignore lint/performance/noAwaitInLoops: each page needs the previous page's cursor
    const response = await fetch(full, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      // Error bodies are not always JSON (e.g. an HTML 502 from a proxy).
      const body: unknown = await response.json().catch(() => null);
      debug('fetch failed', { status: response.status, body });

      const apiMessage = errorBodySchema.safeParse(body).data?.error.message;
      const detail = apiMessage ? `: ${apiMessage}` : '';

      throw new Error(
        `Failed to fetch projects (HTTP ${response.status})${detail}`,
        { cause: apiMessage },
      );
    }

    const data = (await response.json()) as ProjectsPage;
    projects.push(...data.projects);

    const next = data.pagination?.next;
    if (next === null || next === undefined) {
      return projects;
    }
    from = String(next);
  }

  debug('page cap reached', {
    teamId,
    pages: MAX_PROJECT_PAGES,
    count: projects.length,
  });
  return projects;
};

export const fetchProjects = async (teamId: string): Promise<Array<Project>> =>
  fetchProjectsWithToken(teamId, CONFIG.get().bearerToken);
