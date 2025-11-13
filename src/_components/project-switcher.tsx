import { TextAttributes } from '@opentui/core';
import { useMemo } from 'react';
import { useCtx } from '@/ctx';
import { ScrollSelect } from './scroll-select';

export const ProjectSwitcher = () => {
  const {
    projectId: currentProjectId,
    projects,
    setProjectId,
    setModal,
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

  return (
    <ScrollSelect
      focused={true}
      getFocus={() => null}
      onSelect={onSelect}
      rows={sortedProjects.map(project => (
        <box
          alignItems='center'
          flexDirection='row'
          justifyContent='space-between'
          key={project.id}
        >
          <text
            attributes={
              project.id === currentProjectId
                ? TextAttributes.INVERSE
                : TextAttributes.BOLD
            }
          >
            {project.name}
          </text>
          {project.id === currentProjectId ? (
            <text attributes={TextAttributes.DIM}>Current</text>
          ) : null}
          <text attributes={TextAttributes.DIM}>{project.id}</text>
        </box>
      ))}
      title='Switch project'
    />
  );
};
