import { useKeyboard } from '@opentui/react';
import { useMemo } from 'react';
import { QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
import { ScrollSelect } from './scroll-select';
import type { Modal } from '@/types/modal';

const ProjectSwitcher = () => {
  const {
    projectId: currentProjectId,
    projects,
    setProjectId,
    setModal,
    getColor,
  } = useCtx();
  const sortedProjects = useMemo(
    () =>
      [...(projects ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [projects],
  );

  const onSelect = (idx: number) => {
    const project = sortedProjects[idx];
    if (!project) {
      return;
    }

    setProjectId(project.id);
    setModal(null);
  };

  useKeyboard(key => {
    if (QUITTING_KEYS.includes(key.name)) {
      setModal(null);
    }
  });

  return (
    <ScrollSelect
      onSelect={onSelect}
      rows={sortedProjects.map(project => {
        const isCurrent = project.id === currentProjectId;

        return (
          <box alignItems='center' flexDirection='row' gap={1} key={project.id}>
            {isCurrent && <text fg={getColor('accent')}>*</text>}
            <text>{project.name}</text>
          </box>
        );
      })}
      title='Switch project'
    />
  );
};
export const ProjectSwitcherModal: Modal = {
  children: ProjectSwitcher,
  key: 'project-switcher',
} as const;
