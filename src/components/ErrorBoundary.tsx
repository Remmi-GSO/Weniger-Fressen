import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) {
      console.error('Failed to clear cache on error recovery', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAF8] flex items-center justify-center p-5 text-stone-800 font-sans">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-soft-lg border border-stone-200 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-rose-100">
              <AlertTriangle className="w-7 h-7 text-rose-500" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-stone-900">Unerwarteter Fehler</h2>
              <p className="text-xs text-stone-500 mt-1">
                Die Anzeige konnte nicht geladen werden. Deine gespeicherten Daten (Tagebuch, Rezepte, Profil) sind weiterhin sicher in deiner lokalen Datenbank gespeichert.
              </p>
            </div>

            {this.state.error && (
              <div className="text-[11px] font-mono text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>App neu laden & Cache leeren</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
