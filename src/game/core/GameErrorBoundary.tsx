import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class GameErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Breakwater Run could not initialize:', error, info.componentStack)
  }
  render() {
    if (!this.state.error) return this.props.children
    return <main style={{ minHeight: '100dvh', background: '#f3efe4', color: '#183e3c', display: 'grid', placeItems: 'center', padding: 32 }}>
      <section role="alert" style={{ maxWidth: 520 }}>
        <p style={{ letterSpacing: 3, fontSize: 12 }}>BREAKWATER RUN / CONNECTION TO THE COAST</p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', lineHeight: 1 }}>A little trouble<br />reaching the harbor.</h1>
        <p style={{ margin: '24px 0', lineHeight: 1.7 }}>The 3D scene could not start. Try reloading, or use a browser with WebGL 2 and hardware acceleration enabled.</p>
        <button onClick={() => window.location.reload()} style={{ background: '#183e3c', color: '#fff', border: 0, padding: '16px 28px', borderRadius: 4, font: 'inherit', cursor: 'pointer' }}>Retry loading ↗</button>
        <details style={{ marginTop: 24 }}><summary>Technical details</summary><p>{this.state.error.message}</p></details>
      </section>
    </main>
  }
}
