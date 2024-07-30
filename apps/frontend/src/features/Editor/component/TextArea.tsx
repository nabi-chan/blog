import type { ComponentProps } from 'react'
import { useEffect, useRef, useState, forwardRef } from 'react'
import mergeRefs from 'merge-refs'
import { TextArea } from './TextArea.styles'

interface EditorTextAreaProps
  extends Omit<ComponentProps<typeof TextArea>, 'onResize'> {
  initialHeight?: number
  onResize?: (height: number) => void
}

export default forwardRef<HTMLTextAreaElement, EditorTextAreaProps>(
  function EditorTextArea({ initialHeight = 400, onResize, ...props }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [editorHeight, setEditorHeight] = useState(initialHeight)

    const mergedRef = mergeRefs(textareaRef, ref)

    useEffect(() => {
      const ro = new ResizeObserver(([entry]) => {
        const height = entry.borderBoxSize[0].blockSize
        if (height === 0) {
          return
        }

        onResize?.(height)
        setEditorHeight(height)
      })
      ro.observe(textareaRef.current as Element)

      return () => {
        ro.disconnect()
      }
    }, [onResize])

    return (
      <TextArea
        {...props}
        ref={mergedRef}
        placeholder="무언가 입력해보세요..."
        minRows={24}
        style={{
          height: editorHeight,
        }}
      />
    )
  }
)
