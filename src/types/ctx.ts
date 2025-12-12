import type { ReactNode } from 'react';
import type { Theme, ThemeName } from '@/lib/colors';
import type { Project, Projects } from '@/types/vercel-sdk';
import type { Modal } from './modal';

export type Ctx = {
  content: ReactNode;
  setContent: (content: ReactNode) => void;
  modal: Modal | null;
  setModal: (modal: Modal | null) => void;
  error: Error | null;
  projectId: string;
  setProjectId: (projectId: string) => void;
  projects: Projects | null;
  refreshProjects: () => Promise<void>;
  project: Project | null;
  teamId: string;
  getColor: (color: keyof Theme['theme']) => string;
  theme: Theme;
  setTheme: (theme: ThemeName, save?: boolean) => Promise<void>;
};
