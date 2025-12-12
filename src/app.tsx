import { Loading } from '@/_components/loading';
import {
  NoProjectSelected,
  NoProjectsFound,
} from '@/_components/missing-project';
import { useCtx } from '@/ctx';
import { ModalWrapper } from './_components/modal-wrapper';
import { useCommands } from './hooks/use-commands';

export const ConfiguredApp = () => {
  const { content, error, projects, project, modal } = useCtx();
  useCommands();

  if (error) {
    throw error;
  }

  let body = content;

  if (projects === null) {
    body = <Loading label='Loading projects...' />;
  } else if (projects.length === 0) {
    body = <NoProjectsFound />;
  } else if (project === null) {
    body = <NoProjectSelected />;
  }

  return (
    <box
      flexDirection='column'
      flexGrow={1}
      style={{ position: 'relative', minHeight: 0 }}
    >
      {modal ? <ModalWrapper {...modal} /> : null}
      {body}
    </box>
  );
};
