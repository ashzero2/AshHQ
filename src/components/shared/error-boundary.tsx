"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, retry: () => void) => React.ReactNode);
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      const retry = () => this.setState({ hasError: false });

      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error!, retry);
      }
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-4">
          <AlertCircle size={18} className="text-rose opacity-60" />
          <p className="text-xs text-muted-fg">Widget failed to load</p>
          <button
            onClick={retry}
            className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-light transition-colors"
          >
            <RefreshCw size={10} /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
