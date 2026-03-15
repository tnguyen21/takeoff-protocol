import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  resetErrorBoundary(): void {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback != null) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center h-full bg-neutral-900 text-neutral-400 gap-3 p-4">
          <p className="text-sm">This app encountered an error.</p>
          <button
            onClick={() => this.resetErrorBoundary()}
            className="px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-600 text-neutral-300"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
