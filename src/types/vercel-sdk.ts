// Hand-written shapes of the Vercel REST data this app reads (the file name is
// historical). Deployment types come from the zod schema in
// src/lib/deployments.ts. List only fields that are read somewhere in src/.
export type { Deployment, Deployments } from '@/lib/deployments';

export type Project = { id: string; name: string };
export type Projects = Array<Project>;
