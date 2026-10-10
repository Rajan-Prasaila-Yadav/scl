import { useEffect, useRef, useId, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Dialog({ children, onClick, ...props }) {
  const ref = useRef(null)
  const dirty = useRef(false)
  const headingId = useId()
  const [showDiscard, setShowDiscard] = useState(false)
  const pendingClose = useRef(null)
  const keepEditing = useRef(null)
  useEffect(() => { if (showDiscard) keepEditing.current?.focus() }, [showDiscard])
  useEffect(() => {
    const previous = document.activeElement
    const root = ref.current
    const heading = root.querySelector('h1,h2,h3,h4,.modal-title')
    if (heading && !props['aria-label']) {
      if (!heading.id) heading.id = headingId
      root.setAttribute('aria-labelledby', heading.id)
      root.removeAttribute('aria-label')
    }
    const background = []
    for (let node = root; node.parentElement && node !== document.body; node = node.parentElement) {
      for (const sibling of node.parentElement.children) if (sibling !== node) {
        background.push([sibling,sibling.inert]); sibling.inert = true
      }
    }
    const markDirty = () => { dirty.current = true }
    const beforeUnload = event => { if (dirty.current) { event.preventDefault(); event.returnValue = '' } }
    root.addEventListener('input', markDirty)
    root.addEventListener('change', markDirty)
    window.addEventListener('beforeunload', beforeUnload)
    const focusable = () => [...root.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]')].filter(el => el.getClientRects().length && !el.closest('[inert]'))
    ;(focusable()[0] || root).focus()
    const keydown = event => {
      if (event.key === 'Escape') {
        if (pendingClose.current) { event.preventDefault(); const previous = pendingClose.current; pendingClose.current = null; setShowDiscard(false); requestAnimationFrame(() => previous?.focus()); return }
        const close = root.querySelector('.modal-close, [aria-label="Close"]')
        if (close) { event.preventDefault(); close.click() }
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) { event.preventDefault(); root.focus(); return }
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    root.addEventListener('keydown', keydown)
    return () => {
      root.removeEventListener('keydown', keydown)
      root.removeEventListener('input', markDirty)
      root.removeEventListener('change', markDirty)
      window.removeEventListener('beforeunload', beforeUnload)
      background.forEach(([element,inert]) => { element.inert = inert })
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  function confirmDismiss(event) {
    const button = event.target.closest('button')
    const closing = (event.target === ref.current && onClick) || button?.matches('.modal-close,[aria-label="Close"]') || (button && /^(cancel|close)$/i.test(button.textContent.trim()))
    if (closing && dirty.current && !pendingClose.current) {
      event.preventDefault(); event.stopPropagation()
      pendingClose.current = button || ref.current
      setShowDiscard(true)
    }
  }
  function retainChanges(event) {
    event.stopPropagation()
    const previous = pendingClose.current
    pendingClose.current = null; setShowDiscard(false)
    requestAnimationFrame(() => previous?.focus())
  }
  function discardChanges(event) {
    event.stopPropagation()
    const target = pendingClose.current
    dirty.current = false; pendingClose.current = null; setShowDiscard(false)
    target?.click()
  }
  return <div {...props} ref={ref} role="dialog" aria-modal="true" aria-label={props['aria-label'] || 'Record details'} tabIndex={-1} onClickCapture={confirmDismiss} onClick={onClick}>
    <div style={{display:'contents'}} inert={showDiscard ? '' : undefined}>{children}</div>
    {showDiscard && createPortal(<div className="discard-confirmation" role="alertdialog" aria-modal="true" aria-label="Unsaved changes" onClick={e=>e.stopPropagation()} onKeyDown={event => {
      event.stopPropagation()
      if (event.key === 'Escape') { event.preventDefault(); retainChanges(event) }
      if (event.key === 'Tab') {
        const buttons = [...event.currentTarget.querySelectorAll('button')]
        if ((event.shiftKey && document.activeElement === buttons[0]) || (!event.shiftKey && document.activeElement === buttons[buttons.length - 1])) { event.preventDefault(); buttons[event.shiftKey ? buttons.length - 1 : 0].focus() }
      }
    }}>
      <div className="modal-panel" style={{maxWidth:420,padding:24,gap:16}}><h3>Discard unsaved changes?</h3><p>Your edits have not been saved.</p><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><button ref={keepEditing} type="button" className="btn btn-primary" onClick={retainChanges}>Keep editing</button><button type="button" className="btn btn-ghost" onClick={discardChanges}>Discard changes</button></div></div>
    </div>, document.body)}
  </div>
}
