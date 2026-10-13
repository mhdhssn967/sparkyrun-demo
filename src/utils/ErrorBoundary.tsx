import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
  label?: string;
}

/** Renders `fallback` instead of crashing the whole canvas when a child (e.g. a missing .glb) throws. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn(`[${this.props.label ?? 'ErrorBoundary'}] falling back:`, error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
