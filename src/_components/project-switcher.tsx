import { type ScrollBoxRenderable, TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { QUITTING_KEYS } from '@/constants';
import { useCtx } from '@/ctx';
import { useProjects } from '@/hooks/use-projects';
import type { Project } from '@/types/vercel-sdk';

type Props = {
  teamId: string;
  currentProjectId: string;
  onSelect: (project: Project) => void;
  onClose: () => void;
};

export const ProjectSwitcher = ({
  teamId,
  currentProjectId,
  onSelect,
  onClose,
}: Props) => {
  const { getColor } = useCtx();
  const { projects, isLoading, hasFailed, refresh } = useProjects({ teamId });
  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [projects],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const listScrollRef = useRef<ScrollBoxRenderable | null>(null);

  useEffect(() => {
    if (!sortedProjects.length) {
      setSelectedIndex(0);
      return;
    }

    setSelectedIndex(prev => {
      const currentIndex = sortedProjects.findIndex(
        project => project.id === currentProjectId,
      );
      if (currentIndex >= 0) {
        return currentIndex;
      }

      if (prev >= 0 && prev < sortedProjects.length) {
        return prev;
      }

      return 0;
    });
  }, [sortedProjects, currentProjectId]);

  useEffect(() => {
    const scrollbox = listScrollRef.current;
    if (!scrollbox) {
      return;
    }

    if (!sortedProjects.length) {
      scrollbox.scrollTop = 0;
      return;
    }

    const rows = scrollbox.getChildren();
    if (!rows.length) {
      scrollbox.scrollTop = 0;
      return;
    }

    const clampedIndex = Math.max(0, Math.min(selectedIndex, rows.length - 1));
    const row = rows[clampedIndex];
    if (!row) {
      return;
    }

    const viewportHeight = scrollbox.viewport.height;
    if (!viewportHeight) {
      return;
    }

    const rowTop = row.y - scrollbox.content.y;
    const rowBottom = rowTop + row.height;
    const currentScrollTop = scrollbox.scrollTop;
    const maxScrollTop = Math.max(0, scrollbox.scrollHeight - viewportHeight);

    if (rowTop < currentScrollTop) {
      scrollbox.scrollTop = Math.max(0, rowTop);
    } else if (rowBottom > currentScrollTop + viewportHeight) {
      const target = Math.min(
        maxScrollTop,
        Math.max(0, rowBottom - viewportHeight),
      );
      scrollbox.scrollTop = target;
    }
  }, [selectedIndex, sortedProjects.length]);

  useKeyboard(key => {
    if (QUITTING_KEYS.includes(key.name)) {
      onClose();
      return;
    }

    if (key.name === 'r') {
      refresh().catch(err => console.error(err));
      return;
    }

    if (!sortedProjects.length) {
      return;
    }

    if (key.name === 'up') {
      setSelectedIndex(prev => Math.max(0, prev - 1));
      return;
    }

    if (key.name === 'down') {
      setSelectedIndex(prev => Math.min(sortedProjects.length - 1, prev + 1));
      return;
    }

    if (key.name === 'return') {
      const selected = sortedProjects[selectedIndex];
      if (selected) {
        onSelect(selected);
        onClose();
      }
    }
  });

  const renderList = () => {
    if (isLoading) {
      return (
        <box padding={1}>
          <text attributes={TextAttributes.DIM}>Loading projects…</text>
        </box>
      );
    }

    if (hasFailed) {
      return (
        <box padding={1}>
          <text fg='red'>Failed to load projects. Press R to retry.</text>
        </box>
      );
    }

    if (!sortedProjects.length) {
      return (
        <box padding={1}>
          <text attributes={TextAttributes.DIM}>
            No projects available for this team.
          </text>
        </box>
      );
    }

    return (
      <scrollbox
        ref={listScrollRef}
        scrollY
        style={{
          rootOptions: { flexGrow: 1, height: '100%' },
          viewportOptions: { backgroundColor: 'transparent' },
          wrapperOptions: { backgroundColor: 'transparent', flexGrow: 1 },
          contentOptions: {
            flexDirection: 'column',
            gap: 0,
            width: '100%',
          },
          scrollbarOptions: {
            showArrows: false,
            trackOptions: {
              backgroundColor: getColor('backgroundPanel'),
              foregroundColor: getColor('primary'),
            },
          },
        }}
      >
        {sortedProjects.map((project, index) => {
          const isSelected = index === selectedIndex;
          const isCurrent = project.id === currentProjectId;
          return (
            <box
              border={false}
              flexDirection='column'
              key={project.id}
              paddingBottom={1}
              paddingLeft={1}
              paddingRight={1}
              paddingTop={1}
              style={{
                backgroundColor: isSelected
                  ? getColor('backgroundElement')
                  : getColor('backgroundPanel'),
              }}
            >
              <box alignItems='center' justifyContent='space-between'>
                <text
                  attributes={
                    isSelected ? TextAttributes.INVERSE : TextAttributes.BOLD
                  }
                >
                  {project.name}
                </text>
                {isCurrent ? (
                  <text attributes={TextAttributes.DIM}>Current</text>
                ) : null}
              </box>
              <text attributes={TextAttributes.DIM}>{project.id}</text>
            </box>
          );
        })}
      </scrollbox>
    );
  };

  return (
    <box
      flexDirection='column'
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: getColor('background'),
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <box
        border
        flexDirection='column'
        gap={1}
        padding={1}
        style={{
          width: '70%',
          maxWidth: 100,
          height: '70%',
          maxHeight: 35,
          backgroundColor: getColor('backgroundElement'),
        }}
        title='Switch project'
      >
        <box flexDirection='column'>
          <text attributes={TextAttributes.DIM}>
            ↑/↓ navigate • Enter select • ESC close • R refresh
          </text>
        </box>
        <box
          border
          flexDirection='column'
          flexGrow={1}
          style={{ minHeight: 0 }}
        >
          {renderList()}
        </box>
      </box>
    </box>
  );
};
