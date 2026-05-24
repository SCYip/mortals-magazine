import { Component, type ReactNode, type ErrorInfo } from 'react'
import { RotateCcw, AlertTriangle } from 'lucide-react'

type Props = { children: ReactNode; label?: string }
type State = { error: Error | null }

/**
 * Catches uncaught React render errors anywhere below this boundary
 * and shows a recoverable error card instead of unmounting the whole
 * tree. Without this, a single bad row or null reference inside a
 * panel turns the entire app into a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to the console so [mortals]-filtered DevTools sees it.
    console.error('[mortals] boundary caught:', error.message, info?.componentStack?.slice(0, 200))
  }
  reset = () => this.setState({ error: null })
  render() {
    if (this.state.error) {
      return (
        <div className="panel">
          <div className="error-card">
            <div className="error-card__icon"><AlertTriangle size={20} strokeWidth={1.6} /></div>
            <div className="error-card__body">
              <div className="error-card__title">Something went wrong in {this.props.label ?? 'this view'}.</div>
              <div className="error-card__msg">{this.state.error.message}</div>
              <div className="error-card__actions">
                <button className="btn btn--primary" onClick={this.reset}>
                  <RotateCcw size={14} /> Try again
                </button>
                <button className="btn" onClick={() => window.location.reload()}>Reload page</button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
