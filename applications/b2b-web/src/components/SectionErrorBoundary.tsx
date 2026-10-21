import { Component } from 'react';
import type { ReactNode } from 'react';

type Props = { title: string; children: ReactNode; fallback?: ReactNode };
type State = { failed: boolean };

// Arrow-function class members: the codebase forbids the `function` keyword.
export class SectionErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError = (): State => ({ failed: true });

  override render = (): ReactNode => {
    if (!this.state.failed) {
      return this.props.children;
    }
    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }
    return (
      <section className="section" aria-label={this.props.title}>
        <h2>{this.props.title}</h2>
        <p className="error" role="alert">
          Something went wrong in this section.
        </p>
      </section>
    );
  };
}
