import { type RefObject, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { computeTooltipPosition } from '../lib/tooltip-position'
import type { GlossaryEntry } from '~/entities/post'

type Open = { key: string; target: HTMLElement; top: number; left: number }

// 본문의 .term 에 마우스를 올리거나 포커스하면 정의 툴팁을 띄운다. 터치는 탭으로 열고 닫는다
export function TermTooltips({
  container,
  terms,
}: {
  container: RefObject<HTMLElement | null>
  terms: Record<string, GlossaryEntry>
}) {
  const id = useId()
  const [open, setOpen] = useState<Open | null>(null)
  const openTarget = useRef<HTMLElement | null>(null)
  openTarget.current = open?.target ?? null

  useEffect(() => {
    const root = container.current
    if (!root) return
    const termOf = (event: Event) => (event.target as Element | null)?.closest<HTMLElement>('.term') ?? null

    const show = (target: HTMLElement) => {
      const key = target.dataset.termKey
      if (!key || !terms[key]) return
      const rect = target.getBoundingClientRect()
      // 실제 크기는 그린 뒤에 알 수 있어 우선 추정치로 놓고, 아래 effect 에서 다시 맞춘다
      const position = computeTooltipPosition(rect, { width: 280, height: 80 }, { width: window.innerWidth, height: window.innerHeight })
      setOpen({ key, target, top: position.top, left: position.left })
    }
    const hide = () => setOpen(null)

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const target = termOf(event)
      if (target) show(target)
    }
    const onOut = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && termOf(event)) hide()
    }
    const onFocusIn = (event: FocusEvent) => {
      const target = termOf(event)
      if (target) show(target)
    }
    const onTap = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      const target = termOf(event)
      if (!target) return
      if (openTarget.current === target) hide()
      else show(target)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }

    root.addEventListener('pointerover', onOver)
    root.addEventListener('pointerout', onOut)
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', hide)
    root.addEventListener('pointerdown', onTap)
    document.addEventListener('keydown', onKey)
    return () => {
      root.removeEventListener('pointerover', onOver)
      root.removeEventListener('pointerout', onOut)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', hide)
      root.removeEventListener('pointerdown', onTap)
      document.removeEventListener('keydown', onKey)
    }
  }, [container, terms])

  useEffect(() => {
    if (!open) return
    open.target.setAttribute('aria-describedby', id)
    return () => {
      open.target.removeAttribute('aria-describedby')
    }
  }, [open, id])

  if (!open) return null
  const entry = terms[open.key]
  return createPortal(
    <div
      id={id}
      role="tooltip"
      className="term-tooltip"
      style={{ position: 'fixed', top: open.top, left: open.left, maxWidth: 280 }}
      ref={(node) => {
        if (!node) return
        const position = computeTooltipPosition(
          open.target.getBoundingClientRect(),
          { width: node.offsetWidth, height: node.offsetHeight },
          { width: window.innerWidth, height: window.innerHeight },
        )
        node.style.top = `${position.top}px`
        node.style.left = `${position.left}px`
      }}
    >
      <strong>{entry.name}</strong> {entry.definition}
    </div>,
    document.body,
  )
}
