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
          e.preventDefault()
        }
        if (isHotkey('alt+arrowright', e)) {
          instance.navigateOps?.forward()
          e.preventDefault()
        }
        if (isHotkey('mod+=', e)) {
          instance.actionOps?.zoomIn()
          e.preventDefault()
        }
        if (isHotkey('mod+-', e)) {
          instance.actionOps?.zoomOut()
          e.preventDefault()
        }
        if (isHotkey('mod+f', e)) {
          e.preventDefault()
          setBarState(s => ({ ...s, rightBarActive: 'search', showRightBar: s.rightBarActive === 'search' ? !s.showRightBar : true }))
        }
        if (isHotkey('mod+l', e)) {
          e.preventDefault()
          setBarState(s => ({ ...s, rightBarActive: 'label', showRightBar: s.rightBarActive === 'label' ? !s.showRightBar : true }))
        }
        if (isHotkey('shift+f', e)) {
          e.preventDefault()
          instance.actionOps?.fitWidth()
        }
        if (isHotkey('mod+d', e)) {
          e.preventDefault()
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
