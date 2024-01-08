import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { useSetAtom } from 'jotai'
import { PdfBarStateAtom } from '@/core/components/pdf/hooks/usePdfBarState'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'

export default () => {
  const instance = usePdfInstance()
  const setBarState = useSetAtom(PdfBarStateAtom)
  const setPdfState = useSetAtom(PdfStateAtom)
  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      if (instance.isFocused) {
        if (isHotkey('alt+arrowleft', e)) {
          instance.navigateOps?.back()
        }
        if (isHotkey('alt+arrowright', e)) {
          instance.navigateOps?.forward()
        }
        if (isHotkey('cmd+=', e)) {
          instance.actionOps?.zoomIn()
        }
        if (isHotkey('cmd+-', e)) {
          instance.actionOps?.zoomOut()
        }
        if (isHotkey('cmd+f', e)) {
          setBarState(s => ({ ...s, rightBarActive: 'search', showRightBar: s.rightBarActive === 'search' ? !s.showRightBar : true }))
        }
        if (isHotkey('cmd+l', e)) {
          setBarState(s => ({ ...s, rightBarActive: 'label', showRightBar: s.rightBarActive === 'label' ? !s.showRightBar : true }))
        }
        if (isHotkey('shift+f', e)) {
          instance.actionOps?.fitWidth()
        }
        if (isHotkey('cmd+d', e)) {
          setPdfState(s => ({ ...s, handDrag: !s.handDrag }))
        }
      }
    }
    document.addEventListener('keydown', keyboardHandler)
    return () => {
      document.removeEventListener('keydown', keyboardHandler)
    }
  }, [])
  return null
}
