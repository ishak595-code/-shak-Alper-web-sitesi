// @ts-nocheck
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-lg w-full">
            <h1 className="text-2xl font-serif text-white mb-4">Bir Hata Oluştu</h1>
            <p className="text-zinc-400 mb-6">
              Uygulama yüklenirken beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenilemeyi deneyin.
            </p>
            <div className="bg-black/50 p-4 rounded-lg text-left overflow-auto mb-6">
              <code className="text-red-400 text-sm font-mono">
                {this.state.error?.message || 'Bilinmeyen hata'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-brand-500 text-zinc-950 font-medium rounded-xl hover:bg-brand-400 transition-colors"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
