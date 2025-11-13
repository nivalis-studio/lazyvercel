import { Loading } from '@/_components/loading';
import { useCtx } from '@/ctx';
import { ProjectDashboard } from './_components/project';

export const ConfiguredApp = () => {
  const { error, projects, project, modal } = useCtx();

  if (error) {
    throw error;
  }

  if (projects === null) {
    return <Loading label='Loading projets...' />;
  }

  if (!projects.length) {
    // TODO: maybe allow to create a project ?
    throw new Error('No projects found for this config');
  }

  if (!project) {
    // TODO: if !project we should display project switcher to set one
    throw new Error('No project was selected');
  }

  const content = <ProjectDashboard />;

  const Modal = modal?.children ? modal.children : null;

  return (
    <box
      flexDirection='column'
      flexGrow={1}
      style={{ position: 'relative', minHeight: 0 }}
    >
      {Modal}
      {content}
    </box>
  );
};
