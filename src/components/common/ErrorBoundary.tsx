import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Uncaught Enterprise Exception Error Boundary]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-300">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl backdrop-blur-sm">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white tracking-tight">System Fault Intercepted</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected boundary fault occurred. The active process state has been isolated to prevent session corruption.
              </p>
            </div>

            {this.state.error && (
              <pre className="text-[10px] font-mono bg-slate-950 border border-slate-800/80 p-3 rounded-lg overflow-x-auto text-left max-h-[120px] text-red-300">
                {this.state.error.name}: {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Restart Application Shell</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
