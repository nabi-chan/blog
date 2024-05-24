import type { CompositionEventHandler, KeyboardEventHandler } from 'react'
import { useCallback, useMemo, useRef } from 'react'
import { isMacOS } from '@/features/Editor/utils/utils'

export const useIgnoreKeyboardActionsWhileComposing = (
  onKeyDown: KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLDivElement
  >
) => {
  const isComposingRef = useRef(false)
  const hasCompositionEndedRef = useRef(false)

  const handleComposition: CompositionEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLDivElement
  > = useCallback((event) => {
    if (event.type === 'compositionstart') {
      isComposingRef.current = true
      hasCompositionEndedRef.current = false
    }
    if (event.type === 'compositionend') {
      isComposingRef.current = false
      hasCompositionEndedRef.current = true
    }
  }, [])

  const wrappedOnKeyDown: KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLDivElement
  > = useCallback(
    (event) => {
      if (event.key === 'Enter' && isComposingRef.current) {
        return
      }

      /*
       * Safari is known to fire the a unprintable keydown event of 229
       * after the `compositionend` event.
       * This is a workaround to prevent the keydown event from firing and causing
       * the input to be saved.
       *
       * Related: https://bugs.webkit.org/show_bug.cgi?id=165004
       * Related: https://www.stum.de/2016/06/24/handling-ime-events-in-javascript/
       */
      if (
        isMacOS() &&
        event.keyCode === 229 &&
        hasCompositionEndedRef.current
      ) {
        hasCompositionEndedRef.current = false
        return
      }
      onKeyDown(event)
    },
    [onKeyDown]
  )

  const inputProps = useMemo(() => {
    return {
      onCompositionStart: handleComposition,
      onCompositionEnd: handleComposition,
      onKeyDown: wrappedOnKeyDown,
    }
  }, [handleComposition, wrappedOnKeyDown])

  return inputProps
}
