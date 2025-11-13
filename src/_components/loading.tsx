import { useTimeline } from '@opentui/react';
import { useEffect, useState } from 'react';
import { useCtx } from '@/ctx';

const TO_PERCENT = 100;

export const Loading = ({ label }: { label?: string }) => {
  const [progress, setProgress] = useState<number>(0);
  const { getColor } = useCtx();

  const timeline = useTimeline({
    duration: 1200,
    loop: true,
  });

  useEffect(() => {
    const target = { value: 0 };
    timeline.add(
      target,
      {
        value: 100,
        duration: 1000,
        ease: 'linear',
        onUpdate: values => {
          setProgress(values.targets[0].value);
        },
        onComplete: () => {
          setProgress(0);
        },
      },
      0,
    );
  }, [timeline]);

  const barLength = 30;
  const loaderWidth = 8;
  const position = Math.floor(
    (progress / TO_PERCENT) * (barLength + loaderWidth),
  );

  let loadingBar = ' '.repeat(barLength);
  const start = Math.max(0, position - loaderWidth);
  const end = Math.min(barLength, position);

  if (end > start) {
    loadingBar =
      ' '.repeat(start) + '▇'.repeat(end - start) + ' '.repeat(barLength - end);
  }

  const displayLabel = label || 'Loading';

  return (
    <box alignItems='center' flexGrow={1} justifyContent='center'>
      <box
        alignItems='center'
        borderColor={getColor('borderActive')}
        borderStyle='rounded'
        flexDirection='column'
        gap={1}
        justifyContent='center'
        style={{
          paddingLeft: 2,
          paddingRight: 2,
          paddingTop: 1,
          paddingBottom: 1,
        }}
      >
        <text fg={getColor('secondary')}>{displayLabel}</text>
        <text fg={getColor('secondary')}>[{loadingBar}]</text>
      </box>
    </box>
  );
};
