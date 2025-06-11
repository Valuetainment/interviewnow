import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to console with full details
    console.group('🚨 Production Error Details');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.groupEnd();
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl w-full space-y-8">
            <div className="bg-white shadow-lg rounded-lg p-8">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Something went wrong
                </h2>
              </div>
              
              <div className="mt-4 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Error Message:
                  </h3>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                    {this.state.error?.message}
                  </pre>
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <details className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-800">
                      Technical Details (Development Only)
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-words overflow-auto max-h-96">
                      {this.state.error?.stack}
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="default"
                  >
                    Return to Home
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;