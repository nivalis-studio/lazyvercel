#!/usr/bin/env bun
import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { useState } from 'react';
import { Setup } from '@/_components/setup';
import theme from '@/theme/catppuccin.json' with { type: 'json' };
import { ConfiguredApp } from './app';
import { ErrorBoundary } from './error';
import { ExitProvider } from './exit';
import { getConfig } from './lib/config';
import { resetVercelInstance } from './vercel';

const renderer = await createCliRenderer({
  backgroundColor: theme.defs.darkCrust,
});

const App_ = () => {
  const [isConfigured, setIsConfigured] = useState(Boolean(getConfig()));

  if (!isConfigured) {
    return (
      <Setup
        onComplete={() => {
          setIsConfigured(true);
          resetVercelInstance();
        }}
      />
    );
  }

  return (
    <box
      flexDirection='column'
      flexGrow={1}
      style={{ position: 'relative', minHeight: 0 }}
    >
      <ExitProvider>
        <ErrorBoundary>
          <ConfiguredApp />
        </ErrorBoundary>
      </ExitProvider>
    </box>
  );
};

// function App() {
//   const [selectedBranchIndex, setSelectedBranchIndex] = useState<number>(0);
//   const [selectedDeploymentIndex, setSelectedDeploymentIndex] =
//     useState<number>(0);
//   const [viewingDeployment, setViewingDeployment] = useState<
//     Deployment | undefined
//   >(undefined);
//   const [isConfigured, setIsConfigured] = useState(hasConfig());
//   const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
//   const { state: projectConfig, refresh: refreshProject } = useProjectConfig();
//   const { showHelp, showProjectPicker, setShowProjectPicker } = useShortcuts({
//     renderer,
//     enabled: isConfigured,
//   });
//   const isProjectConfigReady = projectConfig.status === 'ready';
//
//   useEffect(() => {
//     if (!isProjectConfigReady) {
//       setActiveProjectId(null);
//       if (showProjectPicker) {
//         setShowProjectPicker(false);
//       }
//     }
//   }, [isProjectConfigReady, showProjectPicker, setShowProjectPicker]);
//
//   if (!isConfigured) {
//     return <Setup />;
//   }
//
//   const resolvedProjectId = isProjectConfigReady
//     ? (activeProjectId ?? projectConfig.projectId)
//     : undefined;
//
//   const handleProjectSelect = (projectId: string) => {
//     setActiveProjectId(projectId);
//     setSelectedBranchIndex(0);
//     setSelectedDeploymentIndex(0);
//     setViewingDeployment(undefined);
//   };
//
//   let content: ReactNode = null;
//
//   if (showHelp) {
//     content = <HelpPanel />;
//   } else {
//     switch (projectConfig.status) {
//       case 'missing_path':
//         content = <MissingProjectPath />;
//         break;
//       case 'missing_id':
//       case 'error':
//         content = <MissingProjectId />;
//         break;
//       case 'ready':
//         content = (
//           <Dashboard
//             currentBranch={currentBranch}
//             projectId={resolvedProjectId ?? projectConfig.projectId}
//             selectedBranchIndex={selectedBranchIndex}
//             selectedDeploymentIndex={selectedDeploymentIndex}
//             setSelectedBranchIndex={setSelectedBranchIndex}
//             setSelectedDeploymentIndex={setSelectedDeploymentIndex}
//             setViewingDeployment={setViewingDeployment}
//             teamId={projectConfig.teamId}
//             viewingDeployment={viewingDeployment}
//           />
//         );
//         break;
//       default:
//         content = <MissingProjectPath />;
//         break;
//     }
//   }
//
//   return (
//     <box
//       flexDirection='column'
//       flexGrow={1}
//       style={{ position: 'relative', minHeight: 0 }}
//     >
//       {content}
//       {showProjectPicker && isProjectConfigReady && resolvedProjectId ? (
//         <ProjectSwitcher
//           currentProjectId={resolvedProjectId}
//           onClose={() => setShowProjectPicker(false)}
//           onSelect={project => handleProjectSelect(project.id)}
//           teamId={projectConfig.teamId}
//         />
//       ) : null}
//     </box>
//   );
// }

createRoot(renderer).render(<App_ />);
