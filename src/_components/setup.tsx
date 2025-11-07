import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useEffect, useRef, useState } from 'react';
import { saveConfig } from '@/lib/config';

type Props = {
  onComplete: () => void;
};

export const Setup = ({ onComplete }: Props) => {
  const [error, setError] = useState('');
  // biome-ignore lint/suspicious/noExplicitAny: Okayish
  const textareaRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const token =
      textarea.editBuffer?.getText?.() || textarea.getText?.() || '';
    if (token.trim().length === 0) {
      setError('Token cannot be empty');
      return;
    }

    try {
      saveConfig({ bearerToken: token.trim() });
      onComplete();
    } catch {
      setError('Failed to save configuration');
    }
  };

  useKeyboard(key => {
    if (key.name === 'escape') {
      handleSave();
    }
  });

  return (
    <box flexDirection='column' flexGrow={1} padding={1}>
      <box alignItems='flex-end' justifyContent='flex-start' marginBottom={1}>
        <ascii-font font='tiny' text='Nivalis Vercel TUI' />
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
              marginTop={1}
              paddingLeft={1}
              paddingRight={1}
              style={{ backgroundColor: '#1f2335' }}
            >
              <textarea
                placeholder='Paste your Vercel token here...'
                ref={textareaRef}
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
              Press ESC when done (token auto-saves) | Ctrl+C to quit
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
