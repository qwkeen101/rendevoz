import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { useSetAtom } from 'jotai'
import { PdfBarStateAtom } from '@/core/components/pdf/hooks/usePdfBarState'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import { KEY } from '@/consts'

export default () => {
  const instance = usePDFInstance()
  const setBarState = useSetAtom(PdfBarStateAtom)
  const setPdfState = useSetAtom(PdfStateAtom)
  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      if (instance.isFocused) {
        if (isHotkey('alt+arrowleft', e)) {
          instance.navigateOps?.back()
          e.preventDefault()
        }
        if (isHotkey('mod+alt+a', e)) {
          e.preventDefault()
          setPdfState(s => ({ ...s, croppingImage: !s.croppingImage }))
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
        if (isHotkey(KEY.Escape, e)) {
          setPdfState(s => {
            if (s.croppingImage) {
              e.preventDefault()
              return {
                ...s,
                croppingImage: false
              }
            }
            return s
          })
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
