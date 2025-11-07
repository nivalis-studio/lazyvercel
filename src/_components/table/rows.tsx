import { type ScrollBoxRenderable, TextAttributes } from '@opentui/core';
import { useEffect, useMemo } from 'react';
import {
  type Column,
  columns,
  getColumnStyle,
} from '@/_components/table/columns';
import {
  getBranch,
  getCommit,
  getCreatedAt,
  getStatusInfo,
} from '@/lib/extract-deploy-details';
import { getTimeAgo } from '@/lib/time-ago';
import theme from '@/theme/catppuccin.json' with { type: 'json' };
import type { Deployments } from '@/types/vercel-sdk';

const formatRelativeTime = (ts: number) => getTimeAgo(new Date(ts));

const truncate = (str: string, len: number) =>
  str.length > len ? `${str.slice(0, Math.max(0, len - 1))}…` : str;

type Props = {
  bodyPaddingLeft: number;
  bodyPaddingRight: number;
  scrollboxRef: React.RefObject<ScrollBoxRenderable | null>;
  deployments: Deployments;
  selectedBranch: string | undefined;
  selectedDeploymentIndex: number;
  setSelectedDeploymentIndex: React.Dispatch<React.SetStateAction<number>>;
  setVerticalScrollbarWidth: React.Dispatch<React.SetStateAction<number>>;
};

export const TableRows = ({
  bodyPaddingLeft,
  bodyPaddingRight,
  scrollboxRef,
  deployments,
  selectedBranch,
  selectedDeploymentIndex,
  setSelectedDeploymentIndex,
  setVerticalScrollbarWidth,
}: Props) => {
  const filtered = useMemo(() => {
    if (selectedBranch === 'All') {
      return deployments;
    }
    return deployments.filter(d => getBranch(d) === selectedBranch);
  }, [deployments, selectedBranch]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => getCreatedAt(b) - getCreatedAt(a)),
    [filtered],
  );

  useEffect(() => {
    setSelectedDeploymentIndex(prev => {
      if (sorted.length === 0) {
        return 0;
      }
      const maxIndex = sorted.length - 1;
      return prev > maxIndex ? maxIndex : prev;
    });
  }, [sorted.length, setSelectedDeploymentIndex]);

  useEffect(() => {
    const scrollbox = scrollboxRef.current;
    if (!scrollbox) {
      setVerticalScrollbarWidth(0);
      return;
    }

    const currentScrollbarWidth = scrollbox.verticalScrollBar?.visible
      ? (scrollbox.verticalScrollBar.width ?? 0)
      : 0;

    setVerticalScrollbarWidth(prev =>
      prev === currentScrollbarWidth ? prev : currentScrollbarWidth,
    );

    if (sorted.length === 0) {
      scrollbox.scrollTo(0);
      return;
    }

    const rows = scrollbox.getChildren();
    if (!rows.length) {
      scrollbox.scrollTop = 0;
      return;
    }

    const rowIndex = Math.min(selectedDeploymentIndex, rows.length - 1);
    if (rowIndex < 0) {
      scrollbox.scrollTop = 0;
      return;
    }

    const row = rows[rowIndex];
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
  }, [
    selectedDeploymentIndex,
    sorted.length,
    scrollboxRef.current,
    setVerticalScrollbarWidth,
  ]);

  const [timeCol, statusCol, targetCol, urlCol, branchCol, commitCol] =
    columns as [
      Column, // time
      Column, // status
      Column, // target
      Column, // url
      Column, // branch
      Column, // commit
    ];

  return (
    <box
      flexDirection='column'
      flexGrow={1}
      style={{ minHeight: 0, height: '100%' }}
    >
      <scrollbox
        ref={scrollboxRef}
        style={{
          rootOptions: {
            flexGrow: 1,
            minHeight: 0,
            height: '100%',
          },
          wrapperOptions: {
            backgroundColor: theme.defs.darkMantle,
            minHeight: 0,
            height: '100%',
          },
          viewportOptions: {
            backgroundColor: theme.defs.darkCrust,
            minHeight: 0,
            height: '100%',
          },
          contentOptions: {
            backgroundColor: theme.defs.darkCrust,
            flexDirection: 'column',
            gap: 0,
            paddingLeft: bodyPaddingLeft,
            paddingRight: bodyPaddingRight,
          },
          scrollbarOptions: {
            showArrows: true,
            trackOptions: {
              foregroundColor: theme.defs.darkBlue,
              backgroundColor: theme.defs.darkSurface0,
            },
          },
        }}
      >
        {sorted.map((d, index) => {
          const createdAt = getCreatedAt(d);
          const status = getStatusInfo(d);
          const branch = getBranch(d);
          const commit = getCommit(d);
          const isSelected = index === selectedDeploymentIndex;

          return (
            <box
              flexDirection='row'
              gap={2}
              key={d.uid}
              style={{
                backgroundColor: isSelected ? '#2e3440' : undefined,
              }}
            >
              {/* Time */}
              <box style={getColumnStyle(timeCol)}>
                <text attributes={TextAttributes.DIM}>
                  {formatRelativeTime(createdAt)}
                </text>
              </box>

              {/* Status */}
              <box style={getColumnStyle(statusCol)}>
                <text fg={status.fg}>{status.label}</text>
              </box>

              {/* Target */}
              <box style={getColumnStyle(targetCol)}>
                <text>{d.target ?? ''}</text>
              </box>

              {/* URL */}
              <box style={getColumnStyle(urlCol)}>
                <text>{truncate(d.url, 48)}</text>
              </box>

              {/* Branch */}
              <box style={getColumnStyle(branchCol)}>
                <text>{truncate(branch, branchCol.width ?? 18)}</text>
              </box>

              {/* Commit */}
              <box style={getColumnStyle(commitCol)}>
                <text attributes={TextAttributes.DIM}>{commit}</text>
              </box>
            </box>
          );
        })}
      </scrollbox>
    </box>
  );
};
