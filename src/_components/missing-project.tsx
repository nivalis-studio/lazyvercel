import { TextAttributes } from '@opentui/core';

export const MissingProjectPath = () => (
  <box alignItems='center' flexGrow={1} justifyContent='center'>
    <box alignItems='flex-end' justifyContent='center'>
      <ascii-font font='tiny' text='Error 404' />
      <text attributes={TextAttributes.DIM}>
        Could not find project config...
      </text>
      <text attributes={TextAttributes.DIM}>
        try running `vercel link` maybe
      </text>
    </box>
  </box>
);

export const MissingProjectId = () => (
  <box alignItems='center' flexGrow={1} justifyContent='center'>
    <box alignItems='flex-end' justifyContent='center'>
      <ascii-font font='tiny' text='Error 404' />
      <text attributes={TextAttributes.DIM}>
        Could not find project or organization ID...
      </text>
      <text attributes={TextAttributes.DIM}>
        try running `vercel link` maybe
      </text>
    </box>
  </box>
);

export const LoadingProjectError = () => (
  <box alignItems='center' flexGrow={1} justifyContent='center'>
    <box alignItems='flex-end' justifyContent='center'>
      <ascii-font font='tiny' text='Error 500' />
      <text attributes={TextAttributes.DIM}>
        Could not fetch the project...
      </text>
      <text attributes={TextAttributes.DIM}>this might be a network issue</text>
    </box>
  </box>
);

export const LoadingDeploymentsError = () => (
  <box alignItems='center' flexGrow={1} justifyContent='center'>
    <box alignItems='flex-end' justifyContent='center'>
      <ascii-font font='tiny' text='Error 500' />
      <text attributes={TextAttributes.DIM}>
        Could not fetch deployments...
      </text>
      <text attributes={TextAttributes.DIM}>this might be a network issue</text>
    </box>
  </box>
);

export const NoProjectsFound = () => (
  <box alignItems='center' flexGrow={1} justifyContent='center'>
    <box flexDirection='column' gap={1} padding={1}>
      <ascii-font font='tiny' text='No projects' />
      <text attributes={TextAttributes.DIM}>
        Vercel returned an empty project list for this team.
      </text>
      <text attributes={TextAttributes.DIM}>
        Check your token scope, or run `vercel link` in the right workspace.
      </text>
      <text attributes={TextAttributes.DIM}>
        Tip: press Ctrl+R to retry fetching projects.
      </text>
    </box>
  </box>
);

export const NoProjectSelected = () => (
  <box alignItems='center' flexGrow={1} justifyContent='center'>
    <box flexDirection='column' gap={1} padding={1}>
      <ascii-font font='tiny' text='Pick a project' />
      <text attributes={TextAttributes.DIM}>
        Your saved project id is not in the fetched project list.
      </text>
      <text attributes={TextAttributes.DIM}>
        Press Ctrl+G to open the project switcher.
      </text>
      <text attributes={TextAttributes.DIM}>
        If this keeps happening, re-run `vercel link` for this repo.
      </text>
    </box>
  </box>
);
