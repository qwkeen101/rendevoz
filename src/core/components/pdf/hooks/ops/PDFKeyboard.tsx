import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { useSetAtom } from 'jotai'
import { PDFStateAtom } from '@/core/components/pdf/hooks/usePDFState'
import { KEY } from '@/consts'

export default () => {
  const instance = usePDFInstance()
  const setPdfState = useSetAtom(PDFStateAtom)
  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
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
      if (instance.isFocused) {
        if (isHotkey('mod+a', e)) {
          if (!(e.target instanceof HTMLElement && e.target.closest('input,textarea,[contenteditable="true"]'))) {
            e.preventDefault()
            setPdfState(s => ({ ...s, croppingImage: !s.croppingImage }))
          }
        }
        if (isHotkey('mod+=', e)) {
          instance.actionOps?.zoomIn()
          e.preventDefault()
        }
        if (isHotkey('mod+-', e)) {
          instance.actionOps?.zoomOut()
          e.preventDefault()
        }
        if (isHotkey('shift+f', e)) {
          e.preventDefault()
          instance.actionOps?.fitWidth()
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
