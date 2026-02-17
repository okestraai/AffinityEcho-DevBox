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
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4">
          <div className="max-w-lg w-full text-center">
            {/* Illustration */}
            <div className="mb-8">
              <div className="mx-auto w-32 h-32 relative">
                <div className="absolute inset-0 bg-purple-100 rounded-full animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.3-3.08a.75.75 0 010-1.3l5.3-3.08a.75.75 0 011.16.63v6.2a.75.75 0 01-1.16.64z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 12a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-5">
              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Something went wrong
                </h1>
                <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">
                  We hit an unexpected issue. Don't worry — your data is safe. Try reloading the page or heading back home.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reload Page
                </button>
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
                  </svg>
                  Go Home
                </button>
              </div>

              {/* Dev-only error details */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left bg-red-50 border border-red-200 p-4 rounded-xl text-sm font-mono overflow-auto max-h-72">
                  <summary className="cursor-pointer font-semibold text-red-700 mb-2">
                    Developer: Error details
                  </summary>
                  <pre className="text-red-600 whitespace-pre-wrap text-xs">
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <p className="mt-6 text-xs text-gray-400">
              If this keeps happening, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;