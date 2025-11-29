import { RefObject, useEffect } from 'react'
import { MetaObject } from '~/typings'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { mousePos } from '@/hooks/utils/useMousePositionRef'

export default (ref: RefObject<HTMLElement>, onPaste?: (objs: MetaObject[]) => void) => {
  const pasteHandler = (e: KeyboardEvent) => {
    if (isHotkey(KEY.Paste, e)) {
      const container = ref.current
      if (container) {
        const ele = document.elementFromPoint(mousePos.current[0], mousePos.current[1])
        if (ele && container.contains(ele)) {
          // GlobalInstance.metaOps?.getCopiedMetaObjects?.().then(res => {
          //   if (res?.length) {
          //     onPaste?.(res)
          //   }
          // })
        }
      }
    }
  }
  useEffect(() => {
    document.addEventListener('keydown', pasteHandler)
    return () => {
      document.removeEventListener('keydown', pasteHandler)
    }
  })
}
