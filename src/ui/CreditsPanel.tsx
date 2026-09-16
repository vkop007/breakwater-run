import { useAppStore } from '../stores/appStore'
import Modal from './Modal'
import { Brand } from './Icons'
export default function CreditsPanel() {
  const openPanel = useAppStore((state) => state.openPanel)
  return <Modal title="Made for the long way home." eyebrow="CREDITS / A CORNER OF THE COAST" onClose={() => openPanel(null)} className="credits-modal"><p className="modal-intro">An original little corner of the coast, built for your browser.</p><div className="credits-wordmark"><Brand /><span>PORT SOLARA<br />EST. 2026</span></div><dl className="credits-list"><div><dt>A WORLD OF OUR OWN</dt><dd>Lantern Quay, its buildings, vehicles, and characters are original procedural geometry. Every piece is drawn live in 3D. Original audio is synthesized in your browser.</dd></div><div><dt>BUILT WITH OPEN-SOURCE TOOLS</dt><dd>React, TypeScript, Three.js, React Three Fiber, Drei, Zustand, and Vite. Rapier powers collisions, character movement, and vehicle suspension.</dd></div><div><dt>TYPE & CHARACTER</dt><dd>Barlow Condensed and DM Sans.</dd></div><div><dt>WHERE WE ARE</dt><dd>Playable district · Version 0.2.0<br />Explore, drive, find work, and make your own way around Lantern Quay.</dd></div></dl><button className="button-primary full-width" onClick={() => openPanel(null)}>Back to the coast <span>↗</span></button></Modal>
}
