import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react'

export type FormattingToolsHandlers = {
  header: () => void
  bold: () => void
  italic: () => void
  quote: () => void
  code: () => void
  link: () => void
  unorderedList: () => void
  orderedList: () => void
  taskList: () => void
  image: () => void
}

let hasRegisteredToolbarElement = false

export const FormattingTools = forwardRef<
  FormattingToolsHandlers,
  { forInputId: string }
>(({ forInputId }, forwadedRef) => {
  useEffect(() => {
    if (!hasRegisteredToolbarElement) import('@github/markdown-toolbar-element')
    hasRegisteredToolbarElement = true
  }, [])

  const headerRef = useRef<HTMLElement>(null)
  const boldRef = useRef<HTMLElement>(null)
  const italicRef = useRef<HTMLElement>(null)
  const quoteRef = useRef<HTMLElement>(null)
  const codeRef = useRef<HTMLElement>(null)
  const linkRef = useRef<HTMLElement>(null)
  const unorderedListRef = useRef<HTMLElement>(null)
  const orderedListRef = useRef<HTMLElement>(null)
  const taskListRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLElement>(null)

  useImperativeHandle(forwadedRef, () => ({
    header: () => headerRef.current?.click(),
    bold: () => boldRef.current?.click(),
    italic: () => italicRef.current?.click(),
    quote: () => quoteRef.current?.click(),
    code: () => codeRef.current?.click(),
    link: () => linkRef.current?.click(),
    unorderedList: () => unorderedListRef.current?.click(),
    orderedList: () => orderedListRef.current?.click(),
    taskList: () => taskListRef.current?.click(),
    image: () => imageRef.current?.click(),
  }))

  return (
    <markdown-toolbar
      for={forInputId}
      style={{ display: 'none' }}
    >
      <md-header ref={headerRef} />
      <md-bold ref={boldRef} />
      <md-italic ref={italicRef} />
      <md-quote ref={quoteRef} />
      <md-code ref={codeRef} />
      <md-link ref={linkRef} />
      <md-unordered-list ref={unorderedListRef} />
      <md-ordered-list ref={orderedListRef} />
      <md-task-list ref={taskListRef} />
      <md-image ref={imageRef} />
    </markdown-toolbar>
  )
})
