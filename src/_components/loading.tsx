import { TextAttributes } from '@opentui/core';
import { useTimeline } from '@opentui/react';
import { useEffect, useState } from 'react';
import type { Project } from '@/types/vercel-sdk';

export const LoadingState = ({ project }: { project?: Project }) => {
  const [bar, setBar] = useState<{ width: number }>({ width: 0 });

  const timeline = useTimeline({
    duration: 2000,
    loop: true,
  });

  useEffect(() => {
    const target = { width: 0 };
    timeline.add(
      target,
      {
        width: 100,
        duration: 800,
        ease: 'linear',
        onUpdate: values => {
          setBar({ ...values.targets[0] });
        },
        onComplete: () => {
          setBar({ width: 0 });
        },
      },
      0,
    );
  }, [timeline]);

  return (
    <box alignItems='center' flexGrow={1} justifyContent='center'>
      <box alignItems='flex-end' justifyContent='center'>
        <ascii-font font='tiny' text='Loading...' />
        <box style={{ width: 40, backgroundColor: '#333333' }}>
          <box
            style={{
              width: `${bar.width}%`,
              height: 1,
              backgroundColor: '#6a5acd',
            }}
          />
        </box>
        {project ? (
          <text attributes={TextAttributes.DIM} key={project.id}>
            {project.name}
          </text>
        ) : null}
      </box>
    </box>
  );
};
