/** biome-ignore-all lint/style/noMagicNumbers: yay */

import { type ScrollBoxRenderable, TextAttributes } from '@opentui/core';
import open from 'open';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DeploymentDetails } from '@/_components/deployment-details';
import { TableHeader } from '@/_components/table/header';
import { TableRows } from '@/_components/table/rows';
import { DEFAULT_BRANCH } from '@/constants';
import { useCtx } from '@/ctx';
import { useDeploymentsShortcuts } from '@/hooks/use-deployment-shortcuts';
import { getBranch, getCreatedAt } from '@/lib/extract-deploy-details';
import type { Deployment, Deployments, Project } from '@/types/vercel-sdk';

type Props = {
  project: Project;
  deployments: Deployments;
  teamId: string;
  currentBranch?: string;
  refresh: () => Promise<void>;
  selectedBranchIndex: number;
  setSelectedBranchIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedDeploymentIndex: number;
  setSelectedDeploymentIndex: React.Dispatch<React.SetStateAction<number>>;
  viewingDeployment: Deployment | undefined;
  setViewingDeployment: React.Dispatch<
    React.SetStateAction<Deployment | undefined>
  >;
};

export const DeploymentsList = ({
  deployments,
  project,
  teamId,
  refresh,
  selectedBranchIndex,
  setSelectedBranchIndex,
  selectedDeploymentIndex,
  setSelectedDeploymentIndex,
  viewingDeployment,
  setViewingDeployment,
}: Props) => {
  const branches = useMemo(() => {
    const latestByBranch = new Map<string, number>();
    for (const deployment of deployments) {
      const branch = getBranch(deployment);
      if (!branch) {
        continue;
      }
      const createdAt = getCreatedAt(deployment);
      const latest = latestByBranch.get(branch);
      if (!latest || createdAt > latest) {
        latestByBranch.set(branch, createdAt);
      }
    }
    const sortedBranches = Array.from(latestByBranch.entries()).sort(
      ([branchA, createdA], [branchB, createdB]) =>
        createdB - createdA || branchA.localeCompare(branchB),
    );
    return [DEFAULT_BRANCH, ...sortedBranches.map(([branch]) => branch)];
  }, [deployments]);

  const asciiBoxWidth = Math.max(project.name.length * 4, 24);

  const selectedBranch = branches[selectedBranchIndex];

  const filtered = useMemo(() => {
    if (selectedBranch === DEFAULT_BRANCH) {
      return deployments;
    }
    return deployments.filter(d => getBranch(d) === selectedBranch);
  }, [deployments, selectedBranch]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => getCreatedAt(b) - getCreatedAt(a)),
    [filtered],
  );

  const { getColor } = useCtx();
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null);
  const branchScrollRef = useRef<ScrollBoxRenderable | null>(null);
  const [verticalScrollbarWidth, setVerticalScrollbarWidth] = useState(0);
  const bodyPaddingLeft = 1;
  const bodyPaddingRight = bodyPaddingLeft + verticalScrollbarWidth;

  useEffect(() => {
    const branchScroll = branchScrollRef.current;
    if (!branchScroll) {
      return;
    }

    const tabs = branchScroll.getChildren();
    if (!tabs.length) {
      branchScroll.scrollLeft = 0;
      return;
    }

    const tabIndex = Math.min(selectedBranchIndex, tabs.length - 1);
    if (tabIndex < 0) {
      branchScroll.scrollLeft = 0;
      return;
    }

    const tab = tabs[tabIndex];
    if (!tab) {
      return;
    }

    const viewportWidth = branchScroll.viewport.width;
    if (!viewportWidth) {
      return;
    }

    const tabLeft = tab.x - branchScroll.content.x;
    const tabRight = tabLeft + tab.width;
    const currentScrollLeft = branchScroll.scrollLeft;
    const maxScrollLeft = Math.max(0, branchScroll.scrollWidth - viewportWidth);

    if (tabLeft < currentScrollLeft) {
      branchScroll.scrollLeft = Math.max(0, tabLeft - 1);
    } else if (tabRight > currentScrollLeft + viewportWidth) {
      const target = Math.min(
        maxScrollLeft,
        Math.max(0, tabRight - viewportWidth + 1),
      );
      branchScroll.scrollLeft = target;
    }
  }, [selectedBranchIndex]);

  useDeploymentsShortcuts({
    branchesLen: branches.length,
    deployments: sorted,
    selectedDeploymentIndex,
    setSelectedBranchIndex,
    setSelectedDeploymentIndex,
    setViewingDeployment,
    viewingDeployment,
    refresh,
    onOpenBrowser: () => {
      const selectedDeployment = sorted[selectedDeploymentIndex];
      const url = `https://vercel.com/${teamId}/${project.name}/${selectedDeployment?.uid}`;
      open(url).catch(err => console.error(err));
    },
  });

  if (viewingDeployment) {
    return (
      <DeploymentDetails
        deployment={viewingDeployment}
        project={project}
        teamId={teamId}
      />
    );
  }

  return (
    <box
      flexDirection='column'
      flexGrow={1}
      padding={1}
      style={{ height: '100%', minHeight: 0 }}
    >
      <box alignItems='center' flexDirection='row' gap={1} marginBottom={1}>
        <scrollbox
          ref={branchScrollRef}
          scrollX
          scrollY={false}
          style={{
            rootOptions: {
              flexGrow: 1,
              height: 3,
            },
            wrapperOptions: {
              backgroundColor: 'transparent',
              height: 3,
            },
            viewportOptions: {
              backgroundColor: 'transparent',
              height: 3,
            },
            contentOptions: {
              flexDirection: 'row',
              gap: 1,
              alignItems: 'center',
              paddingLeft: 1,
              paddingRight: 1,
            },
            scrollbarOptions: {
              showArrows: false,
              trackOptions: {
                foregroundColor: getColor('primary'),
                backgroundColor: getColor('backgroundElement'),
              },
            },
          }}
        >
          {branches.map((branch, index) => {
            const isSelected = index === selectedBranchIndex;
            return (
              <box
                key={branch}
                paddingLeft={1}
                paddingRight={1}
                style={{
                  backgroundColor: isSelected
                    ? getColor('backgroundElement')
                    : undefined,
                }}
              >
                <text
                  attributes={isSelected ? TextAttributes.INVERSE : undefined}
                >
                  {branch}
                </text>
              </box>
            );
          })}
        </scrollbox>
        <box alignItems='flex-end' style={{ width: asciiBoxWidth }}>
          <ascii-font font='tiny' text={project.name} />
        </box>
      </box>

      <box
        border
        flexDirection='column'
        flexGrow={1}
        style={{ minHeight: 0, height: '100%' }}
        title='Deployments'
      >
        <TableHeader
          bodyPaddingLeft={bodyPaddingLeft}
          bodyPaddingRight={bodyPaddingRight}
        />

        <TableRows
          bodyPaddingLeft={bodyPaddingLeft}
          bodyPaddingRight={bodyPaddingRight}
          deployments={deployments}
          scrollboxRef={scrollboxRef}
          selectedBranch={selectedBranch}
          selectedDeploymentIndex={selectedDeploymentIndex}
          setSelectedDeploymentIndex={setSelectedDeploymentIndex}
          setVerticalScrollbarWidth={setVerticalScrollbarWidth}
        />
      </box>
    </box>
  );
};
