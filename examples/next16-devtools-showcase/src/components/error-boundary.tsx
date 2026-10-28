"use client";

import * as React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface via console in dev; DevTools timeline may subscribe to errors.
    console.error("[showcase] error boundary caught", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ border: "1px solid #ef4444", borderRadius: 8, padding: 12 }}
        >
          <strong>Something went wrong.</strong>
          <p style={{ fontSize: 13, color: "#71717a" }}>
            {this.state.message ?? "Unknown error"}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
