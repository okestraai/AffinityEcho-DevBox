// src/components/ErrorBoundary.tsx
import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, replace this with your error reporting service
    // e.g., Sentry.captureException(error, { extra: errorInfo });
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Message */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">Oops! Something went wrong</h1>
              <p className="text-gray-600 leading-relaxed">
                We’re sorry for the inconvenience. The app hit an unexpected error and needs to restart.
              </p>
            </div>

            {/* Action */}
            <button
              onClick={() => window.location.reload()}
              className="w-full max-w-xs mx-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Reload the App
            </button>

            {/* Dev-only details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Click to see error details
                </summary>
                <pre className="text-red-700 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;