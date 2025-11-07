import { TextAttributes } from '@opentui/core';
import theme from '@/theme/catppuccin.json' with { type: 'json' };
import { columns, getColumnStyle } from './columns';

type Props = {
  bodyPaddingLeft: number;
  bodyPaddingRight: number;
};

export const TableHeader = ({ bodyPaddingLeft, bodyPaddingRight }: Props) => {
  return (
    <box
      paddingLeft={bodyPaddingLeft}
      paddingRight={bodyPaddingRight}
      style={{
        backgroundColor: theme.defs.darkCrust,
        border: ['bottom'],
        borderColor: theme.defs.darkSurface0,
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
