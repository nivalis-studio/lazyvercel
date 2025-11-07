import { TextAttributes } from '@opentui/core';

export function HelpPanel() {
  return (
    <box flexDirection='column' flexGrow={1} padding={1}>
      <box alignItems='flex-end' justifyContent='flex-start' marginBottom={1}>
        <ascii-font font='tiny' text='lazyvercel' />
      </box>

      <box border flexDirection='column' flexGrow={1} title='Help'>
        <box flexDirection='column' gap={1} padding={2}>
          <box flexDirection='column' marginBottom={1}>
            <text attributes={TextAttributes.BOLD}>About</text>
            <text attributes={TextAttributes.DIM}>
              Terminal UI for managing Vercel deployments
            </text>
          </box>

          <box flexDirection='column' marginBottom={1}>
            <text attributes={TextAttributes.BOLD}>Global Shortcuts</text>
            <text attributes={TextAttributes.DIM}>? Show this help</text>
            <text attributes={TextAttributes.DIM}>
              Cmd+P / Ctrl+P Switch project
            </text>
            <text attributes={TextAttributes.DIM}>
              Q / ESC Quit application
            </text>
            <text attributes={TextAttributes.DIM}>Ctrl+K Toggle console</text>
          </box>

          <box flexDirection='column' marginBottom={1}>
            <text attributes={TextAttributes.BOLD}>Deployments List</text>
            <text attributes={TextAttributes.DIM}>
              ↑ / ↓ Navigate deployments
            </text>
            <text attributes={TextAttributes.DIM}>
              TAB Cycle branch filter forward
            </text>
            <text attributes={TextAttributes.DIM}>
              Shift+TAB Cycle branch filter backward
            </text>
            <text attributes={TextAttributes.DIM}>
              ENTER View deployment details
            </text>
            <text attributes={TextAttributes.DIM}>
              O Open in Vercel dashboard
            </text>
            <text attributes={TextAttributes.DIM}>R Refresh deployments</text>
          </box>

          <box flexDirection='column'>
            <text attributes={TextAttributes.BOLD}>Deployment Details</text>
            <text attributes={TextAttributes.DIM}>
              BACKSPACE Go back to list
            </text>
            <text attributes={TextAttributes.DIM}>
              O Open in Vercel dashboard
            </text>
          </box>

          <box marginTop={2}>
            <text attributes={TextAttributes.DIM}>
              Press ?, BACKSPACE or ESC to close this help
            </text>
          </box>
        </box>
      </box>
    </box>
  );
}
