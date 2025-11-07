import { useKeyboard } from '@opentui/react';
import type { Deployment } from '@/types/vercel-sdk';

type DeploymentDetailsShortcutsProps = {
  onBack: () => void;
  onOpenBrowser: () => void;
};

export const useDeploymentDetailsShortcuts = ({
  onBack,
  onOpenBrowser,
}: DeploymentDetailsShortcutsProps) => {
  useKeyboard(key => {
    if (key.name === 'backspace') {
      onBack();
      return;
    }

    if (key.name === 'o') {
      onOpenBrowser();
      return;
    }
  });
};

type DeploymentsShortcutsProps = {
  setSelectedBranchIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedDeploymentIndex: number;
  setSelectedDeploymentIndex: React.Dispatch<React.SetStateAction<number>>;
  viewingDeployment: Deployment | undefined;
  setViewingDeployment: React.Dispatch<
    React.SetStateAction<Deployment | undefined>
  >;
  branchesLen: number;
  deployments: Array<Deployment>;
  refresh: () => Promise<void>;
  onOpenBrowser: () => void;
};

export const useDeploymentsShortcuts = ({
  setSelectedBranchIndex,
  selectedDeploymentIndex,
  setSelectedDeploymentIndex,
  viewingDeployment,
  setViewingDeployment,
  branchesLen,
  deployments,
  refresh,
  onOpenBrowser,
}: DeploymentsShortcutsProps) => {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: okay-ish
  useKeyboard(key => {
    if (viewingDeployment) {
      if (key.name === 'backspace') {
        setViewingDeployment(undefined);
      }
      return;
    }

    if (key.name === 'tab' && key.shift) {
      setSelectedDeploymentIndex(0);
      setSelectedBranchIndex(prev => (prev - 1 + branchesLen) % branchesLen);
      return;
    }

    if (key.name === 'tab' && !key.shift) {
      setSelectedDeploymentIndex(0);
      setSelectedBranchIndex(prev => (prev + 1) % branchesLen);
      return;
    }

    if (key.name === 'up') {
      setSelectedDeploymentIndex(prev => Math.max(0, prev - 1));
      return;
    }

    if (key.name === 'down') {
      setSelectedDeploymentIndex(prev =>
        Math.min(deployments.length - 1, prev + 1),
      );
      return;
    }

    if (key.name === 'r') {
      refresh().catch(err => console.error(err));
      return;
    }

    const selectedDeployment = deployments[selectedDeploymentIndex];

    if (key.name === 'return' && selectedDeployment) {
      setViewingDeployment(selectedDeployment);
      return;
    }

    if (key.name === 'o' && selectedDeployment) {
      onOpenBrowser();
      return;
    }
  });
};
