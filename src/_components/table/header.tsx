import { TextAttributes } from '@opentui/core';
import { type Column, columns, getColumnStyle } from './columns';

export const DeploymentListHeader = () => {
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
    <box flexDirection='row' gap={1} key={'header'} width='100%'>
      {/* Time */}
      <box style={getColumnStyle(timeCol)}>
        <text attributes={TextAttributes.DIM}>createdAt</text>
      </box>

      {/* Status */}
      <box style={getColumnStyle(statusCol)}>
        <text attributes={TextAttributes.DIM}>status</text>
      </box>

      {/* URL */}
      <box style={getColumnStyle(urlCol)}>
        <text attributes={TextAttributes.DIM}>deploy url</text>
      </box>

      {/* Branch */}
      <box style={getColumnStyle(branchCol)}>
        <text attributes={TextAttributes.DIM}>branch</text>
      </box>

      {/* Commit */}
      <box style={getColumnStyle(commitCol)}>
        <text attributes={TextAttributes.DIM}>commit</text>
      </box>

      {/* Target */}
      <box style={getColumnStyle(targetCol)}>
        <text attributes={TextAttributes.DIM}>target</text>
      </box>
    </box>
  );
};
