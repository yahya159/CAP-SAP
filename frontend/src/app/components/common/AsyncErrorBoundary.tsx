import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import i18n from '../../../i18n';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
}

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * AsyncErrorBoundary
 * Catches both rendering errors and unhandled promise rejections.
 */
export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AsyncErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  handlePromiseRejection = (event: PromiseRejectionEvent) => {
    console.error('[AsyncErrorBoundary] Unhandled promise rejection:', event.reason);
    this.setState({
      hasError: true,
      error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    });
    event.preventDefault();
  };

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AsyncErrorBoundary] caught rendering error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center bg-background">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">{i18n.t('asyncError.title')}</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {i18n.t('asyncError.description')}
          </p>
        </div>

        {this.state.error && (
          <pre className="mt-2 max-w-lg overflow-auto rounded-md bg-muted px-4 py-3 text-left text-xs text-muted-foreground">
            {this.state.error.message}
          </pre>
        )}

        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={this.handleRetry} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {i18n.t('common.tryAgain')}
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/'} className="gap-2">
            {i18n.t('common.goHome')}
          </Button>
        </div>
      </div>
    );
  }
}
