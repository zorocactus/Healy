import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Error details are available in dev via React's overlay;
    // replace this with a proper logger (Sentry, etc.) when ready.
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-red-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E05555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-base font-bold text-gray-800 mb-1">Une erreur est survenue</p>
          <p className="text-sm text-gray-500 mb-5">
            {import.meta.env.DEV && this.state.error?.message
              ? this.state.error.message
              : "Veuillez rafraîchir la page ou contacter le support."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#4A6FA5] hover:bg-[#365885] transition-colors"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
