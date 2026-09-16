import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalProps { title: string; eyebrow?: string; onClose: () => void; children: ReactNode; className?: string }
export default function Modal({ title, eyebrow, onClose, children, className = '' }: ModalProps) {
  const titleId = useId()
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const element = dialog.current
    element?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !element) return
      const candidates = Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, a[href], [tabindex="0"]')).filter((item) => !item.hidden && item.getClientRects().length > 0)
      const first = candidates[0]
      const last = candidates[candidates.length - 1]
      if (!first) { event.preventDefault(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === element)) { event.preventDefault(); first.focus() }
    }
    element?.addEventListener('keydown', trap)
    return () => { element?.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus() }
  }, [])
  return <div className="modal-backdrop"><section ref={dialog} tabIndex={-1} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
    <div className="modal-topline"><span className="eyebrow">{eyebrow || 'BREAKWATER RUN / FIELD NOTES'}</span><button className="close-button" onClick={onClose} aria-label={`Close ${title}`}>×</button></div>
    <h2 id={titleId}>{title}</h2>
    {children}
  </section></div>
}
