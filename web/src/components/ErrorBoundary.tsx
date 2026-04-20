import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="min-h-screen flex items-center justify-center p-8 bg-[#04070d] text-[#c7e9f5]"
        >
          <div className="max-w-lg w-full border border-hud-line bg-black/80 p-6">
            <div className="font-display uppercase tracking-[0.2em] text-sm text-hud-red mb-2">
              SIGNAL LOST
            </div>
            <h1 className="font-display text-hud-cyan mb-3 tracking-widest">
              DASHBOARD CRASHED
            </h1>
            <pre className="font-mono text-xs text-hud-text whitespace-pre-wrap bg-black/40 border border-hud-line p-3 mb-4 max-h-64 overflow-auto">
              {this.state.error.message}
            </pre>
            <button className="hud-btn" onClick={this.reset}>
              RETRY
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
