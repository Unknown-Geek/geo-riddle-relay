import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[RouteErrorBoundary${this.props.name ? `:${this.props.name}` : ""}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6">
              An unexpected error occurred{this.props.name ? ` in ${this.props.name}` : ""}.
              Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">Error details</summary>
                <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: undefined })}
              >
                Try again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refresh page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
