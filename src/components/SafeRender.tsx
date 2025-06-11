import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorCount: number;
}

export class SafeRender extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorCount: 0
  };

  public static getDerivedStateFromError(error: Error): State | null {
    // Check if it's the specific .add() error
    if (error.message?.includes('Cannot read properties of undefined') && 
        error.message?.includes('add')) {
      console.warn('SafeRender: Suppressing known render error:', error.message);
      // Don't update state for this specific error - let React retry
      return null;
    }
    
    return { hasError: true, errorCount: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log but don't crash for the specific error
    if (error.message?.includes('Cannot read properties of undefined') && 
        error.message?.includes('add')) {
      console.warn('SafeRender: Caught and suppressed error:', error);
      
      // Try to recover by forcing a re-render after a short delay
      setTimeout(() => {
        this.setState(prevState => ({ 
          errorCount: prevState.errorCount + 1,
          hasError: false 
        }));
      }, 100);
      
      return;
    }
    
    console.error('SafeRender: Uncaught error:', error, errorInfo);
  }

  public render() {
    // If we've tried too many times, show fallback
    if (this.state.errorCount > 3) {
      return this.props.fallback || <div>Unable to render this section</div>;
    }
    
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}

export default SafeRender; 