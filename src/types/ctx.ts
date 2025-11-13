import type { Theme } from '@/lib/colors';
import type { Project, Projects } from '@/types/vercel-sdk';
import type { Modal } from './modal';

export type Ctx = {
  modal: Modal;
  setModal: (modal: Modal) => void;
  error: Error | null;
  projectId: string;
  setProjectId: (projectId: string) => void;
  projects: Projects | null;
  refreshProjects: () => Promise<void>;
  project: Project;
  teamId: string;
  getColor: (color: keyof Theme['theme']) => string;
  /** Always use `ctx.getColor` when possible */
  _internal_theme: Theme;
};
