import { TextAttributes } from '@opentui/core';
import { columns, getColumnStyle } from '@/_components/table/columns';
import { useCtx } from '@/ctx';

type Props = {
  bodyPaddingLeft: number;
  bodyPaddingRight: number;
};

export const TableHeader = ({ bodyPaddingLeft, bodyPaddingRight }: Props) => {
  const { getColor } = useCtx();
  return (
    <box
      paddingLeft={bodyPaddingLeft}
      paddingRight={bodyPaddingRight}
      style={{
        backgroundColor: getColor('background'),
        borderColor: getColor('borderSubtle'),
        border: ['bottom'],
        flexShrink: 0,
        height: 3,
        alignItems: 'center',
      }}
    >
      <box flexDirection='row' gap={2}>
        {columns.map(col => (
          <box
            key={col.label}
            style={{
              ...getColumnStyle(col),
              paddingTop: 1,
            }}
          >
            <text attributes={TextAttributes.BOLD}>{col.label}</text>
          </box>
        ))}
      </box>
    </box>
  );
};
