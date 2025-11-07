export type Column = { label: string; width?: number; flex?: number };

export const columns: Array<Column> = [
  { label: 'Time', width: 14 },
  { label: 'Status', width: 12 },
  { label: 'Target', width: 10 },
  { label: 'URL', width: 40 },
  { label: 'Branch', width: 22 },
  { label: 'Commit', width: 8 },
] as const;

export const getColumnStyle = (col: Column) => {
  if (col.width !== undefined) {
    return {
      width: col.width,
      flexGrow: 0,
      flexShrink: 0,
    } as const;
  }

  return {
    flexGrow: col.flex ?? 0,
    flexShrink: col.flex ? 1 : 0,
  } as const;
};
