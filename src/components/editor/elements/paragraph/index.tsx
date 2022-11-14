import { EditorEventHandler } from '@/events/editorEvent'
import useEventEmitter from '@/events/useEventEmitter'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdate } from 'react-use'
import { Editor, Element, Range } from 'slate'
import { ReactEditor, RenderElementProps, useSelected, useSlate } from 'slate-react'
import styles from './index.module.less'

const Paragraph: FC<RenderElementProps> = ({ children, element }) => {
  const editor = useSlate()
  const { t } = useTranslation()
  const handler = new EditorEventHandler()
  const forceUpdate = useUpdate()
  const emitter = useEventEmitter()
  const selected = useSelected()
  const selection = useSlate().selection
  let isCollapsed = true
  if (selection !== null) {
    isCollapsed = Range.isCollapsed(selection)
  }

  const hidePlaceHolder = ReactEditor.isComposing(editor)

  const handleComposition = () => {
    if (Editor.isEmpty(editor, element)) {
      forceUpdate()
    }
  }
  useEffect(() => {
    emitter.addListener('editor', handler)
    document.addEventListener('compositionupdate', handleComposition)
    return () => {
      emitter.removeListener('editor', handler)
      document.removeEventListener('compositionupdate', handleComposition)
    }
  }, [])
  const isEmpty = element.children[0].text === '' && element.children.length === 1
  useEffect(() => {
    if (element.children[0].text === '/') {
      emitter.emit('editor', {
        type: 'openMenu'
      })
    }
  }, [element])
  return (
    <div
      data-placeholder={t('editor.placeholder')}
      style={{ fontSize: element.children[0].text === '' ? element.children[0].fontSize : undefined }}
      className={selected && isCollapsed && isEmpty && !hidePlaceHolder ? styles.selectedEmpty : undefined}
    >
      {children}
    </div>
  )
}
export default Paragraph
