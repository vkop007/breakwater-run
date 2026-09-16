import { Brand } from './Icons'
export default function LoadingScreen() {
  return <div className="loading-screen" role="status" aria-live="polite"><Brand /><div className="loading-copy"><span className="eyebrow">NEXT STOP / PORT SOLARA</span><h1>A little closer<br />to the coast.</h1><div className="loading-track" aria-hidden="true"><span /></div><p>Preparing the neighborhood…</p><p className="loading-tip">Once you arrive: use WASD to move and E to interact.</p></div><span className="eyebrow">BREAKWATER RUN · LANTERN QUAY</span></div>
}
