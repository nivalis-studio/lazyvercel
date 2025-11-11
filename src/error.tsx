import { Component, type ReactNode } from 'react';
import { THEME } from './theme';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

class ErrorBoundary_ extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  override render() {
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
            backgroundColor: THEME.defs.darkCrust,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <box
            border
            borderColor={THEME.defs.darkRed}
            flexDirection='column'
            gap={1}
            padding={1}
            style={{
              width: '70%',
              maxWidth: 100,
              height: 'auto',
              backgroundColor: THEME.defs.darkCrust,
            }}
            title='Error'
          >
            <text
              content={`${this.state.error?.message || 'Unknown error'}`}
              fg={THEME.defs.darkRed}
            />
            <text content={`${this.state.error?.cause || ''}`} />
          </box>
        </box>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = ErrorBoundary_ as unknown as (props: {
  children: ReactNode;
}) => ReactNode;
