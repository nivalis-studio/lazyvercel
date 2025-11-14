import { TextAttributes } from '@opentui/core';
import { useState } from 'react';
import { getThemeColor } from '@/lib/colors';
import { saveConfig, validateToken } from '@/lib/config';
import defaultTheme from '@/theme/catppuccin.json' with { type: 'json' };

export const Setup = () => {
  const [error, setError] = useState('');
  const [value, setValue] = useState('');
  const getColor = getThemeColor(defaultTheme);

  const handleSave = async (token_: string) => {
    const token = token_.trim();

    if (token.length === 0) {
      setError('Token cannot be empty');
      return;
    }

    const isValid = await validateToken(token);

    if (!isValid) {
      setError('Invalid or expired token');
      return;
    }

    try {
      await saveConfig({ bearerToken: token });
    } catch {
      setError('Failed to save configuration');
    }
  };

  return (
    <box flexDirection='column' flexGrow={1} padding={1}>
      <box alignItems='flex-end' justifyContent='flex-start' marginBottom={1}>
        <ascii-font font='tiny' text='lazyvercel' />
      </box>

      <box border flexDirection='column' flexGrow={1} title='Setup'>
        <box flexDirection='column' gap={1} padding={2}>
          <box flexDirection='column' marginBottom={2}>
            <text attributes={TextAttributes.BOLD}>Welcome to Vercel TUI!</text>
            <text attributes={TextAttributes.DIM}>
              First-time setup required
            </text>
          </box>

          <box flexDirection='column' marginBottom={2}>
            <text attributes={TextAttributes.BOLD}>
              Generate a Vercel Token
            </text>
            <text attributes={TextAttributes.DIM}>
              1. Visit: https://vercel.com/account/tokens
            </text>
            <text attributes={TextAttributes.DIM}>2. Click "Create Token"</text>
            <text attributes={TextAttributes.DIM}>
              3. Give it a name (e.g., "Vercel TUI")
            </text>
            <text attributes={TextAttributes.DIM}>
              4. Select appropriate scope
            </text>
            <text attributes={TextAttributes.DIM}>
              5. Copy the generated token
            </text>
          </box>

          <box flexDirection='column' marginBottom={1}>
            <text attributes={TextAttributes.BOLD}>
              Enter your Vercel Token:
            </text>
            <box
              border
              padding={1}
              paddingTop={0}
              style={{ backgroundColor: getColor('background') }}
            >
              <input
                focused
                onInput={setValue}
                onPaste={event => {
                  setValue(event.text);
                }}
                onSubmit={handleSave}
                placeholder='Paste your Vercel token here...'
                value={value}
              />
            </box>
          </box>

          {error && (
            <box marginBottom={1}>
              <text fg='red'>{error}</text>
            </box>
          )}

          <box flexDirection='column' marginTop={2}>
            <text attributes={TextAttributes.DIM}>
              Press Enter when done (token auto-saves) | Ctrl+C to quit
            </text>
            <text attributes={TextAttributes.DIM}>
              Token will be saved to: ~/.config/lazyvercel/config.json
            </text>
          </box>
        </box>
      </box>
    </box>
  );
};
