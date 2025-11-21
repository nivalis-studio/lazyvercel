import { useKeyboard } from '@opentui/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useCtx } from '@/ctx';
import type { BoxOptions, ScrollBoxRenderable } from '@opentui/core';

export type ScrollSelectProps = {
  header?: ReactNode;
  rows: Array<ReactNode>;
  focused?: boolean;
  getFocus?: () => void;
  onSelect: (idx: number) => void;
  onHover?: (idx: number) => void;
} & BoxOptions;

export const ScrollSelect = ({
  header,
  rows,
  focused = true,
  getFocus = () => null,
  onSelect,
  onHover: onHover_,
  ...props
}: ScrollSelectProps) => {
  const { getColor } = useCtx();
  const scrollRef = useRef<ScrollBoxRenderable | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState(0);

  const onHover = (idx: number) => {
    if (onHover_) {
      onHover_(idx);
    }

    setHoveredIdx(idx);
  };

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) {
      return;
    }

    // how many rows are visible in the scrollbox viewport
    const viewportH = scroll.viewport.height;

    if (!viewportH || rows.length === 0) {
      return;
    }

    // current visible range [top, bottom] (inclusive)
    const top = scroll.scrollTop;
    const bottom = top + viewportH - 1;

    if (hoveredIdx < top) {
      // hovered row is above the viewport -> scroll up so it's the first row
      scroll.scrollTop = hoveredIdx;
    } else if (hoveredIdx > bottom) {
      // hovered row is below the viewport -> scroll down so it's the last row
      const maxTop = Math.max(0, scroll.scrollHeight - viewportH);
      const targetTop = Math.min(hoveredIdx - viewportH + 1, maxTop);
      scroll.scrollTop = targetTop;
    }
  }, [hoveredIdx, rows.length]);

  useKeyboard(key => {
    if (!focused || rows.length === 0) {
      return;
    }

    if (key.name === 'down' || key.name === 'j') {
      const idx = (hoveredIdx + 1) % rows.length;
      onHover(idx);
      return;
    }

    if (key.name === 'up' || key.name === 'k') {
      const idx = (hoveredIdx - 1 + rows.length) % rows.length;
      onHover(idx);
      return;
    }

    if (key.name === 'return' || key.name === 'space') {
      onSelect(hoveredIdx);
      return;
    }
  });

  return (
    <box
      borderColor={focused ? getColor('secondary') : getColor('borderSubtle')}
      borderStyle='rounded'
      flexDirection='column'
      height='100%'
      onMouseOver={getFocus}
      padding={1}
      {...props}
    >
      {header ? header : null}
      <scrollbox
        flexDirection='column'
        flexGrow={1}
        overflow='scroll'
        ref={scrollRef}
      >
        {rows.map((row, idx) => {
          const isHovered = hoveredIdx === idx;

          return (
            <box
              backgroundColor={
                isHovered ? getColor('backgroundElement') : undefined
              }
              // biome-ignore lint/suspicious/noArrayIndexKey: .
              key={idx}
              onMouseDown={() => onSelect(idx)}
              onMouseOver={() => onHover(idx)}
              width='100%'
            >
              {row}
            </box>
          );
        })}
      </scrollbox>
    </box>
  );
};
