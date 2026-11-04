import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erro inesperado na interface:', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="container section">
          <div className="feedback-state feedback-state--error">
            <h1>Essa resenha deu uma travada.</h1>
            <p>Recarregue a página para tentar de novo. Seus votos continuam salvos.</p>
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
