import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  key?: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] p-6 sm:p-10 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {this.props.fallbackTitle || 'Une anomalie d\'affichage est survenue'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Le module a rencontré une anomalie inattendue. Vos données sont préservées. Cliquez ci-dessous pour recharger ce module en toute sécurité.
              </p>
              {this.state.error && (
                <p className="mt-3 text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30 text-left truncate">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center space-x-2 shadow-md transition-transform hover:scale-105 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Recharger le module</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
