import { TextAttributes } from '@opentui/core';
import { Component, type ReactNode } from 'react';
import { getThemeColor, type Theme } from '@/lib/colors';
import themeJSON from '@/theme/catppuccin.json' with { type: 'json' };

type ErrorBoundaryProps = {
  children: ReactNode;
  theme: Theme;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  theme: Theme;
};

class ErrorBoundary_ extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, theme: props.theme };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, theme: themeJSON };
  }

  override componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  override render() {
    const getColor = getThemeColor(this.state.theme);
    if (this.state.hasError) {
      console.error(this.state.error?.stack);
      return (
        <box
          flexDirection='column'
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: getColor('background'),
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <box
            border
            borderColor={getColor('borderActive')}
            flexDirection='column'
            gap={1}
            padding={1}
            style={{
              width: '70%',
              maxWidth: 100,
              height: 'auto',
              backgroundColor: getColor('background'),
            }}
            title='Error'
          >
            <text
              content={`${this.state.error?.message || 'Unknown error'}`}
              fg={getColor('error')}
            />
            <text content={`${this.state.error?.cause || ''}`} />
            <text attributes={TextAttributes.DIM}>press Q to quit</text>
          </box>
        </box>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = ErrorBoundary_ as unknown as (
  props: ErrorBoundaryProps,
) => ReactNode;
