import Id from '@/utils/id'
import { RefObject, useEffect } from 'react'
import { Editor, Transforms } from 'slate'
import { CustomEditor } from '~/typings'
import { ReactEditor } from '@/core'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

const useAutoInsertEndline = (scrollElementRef: RefObject<HTMLElement>, editor: CustomEditor) => {
  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (scrollElement) {
      const clickHandler = (e: MouseEvent) => {
        if (editor.editorMode === 'syncedBlock') return
        const textbox = scrollElementRef.current?.querySelector('[role="textbox"]')
        const lastEleRect = textbox?.lastElementChild?.getBoundingClientRect()
        const lastEle = editor.children[editor.children.length - 1]
        const shouldInsertRow =
          lastEle.hide || !(lastEle.type === 'paragraph' && lastEle.children.length === 1 && lastEle.children[0].text === '')

        if (lastEleRect && e.clientY > lastEleRect.bottom) {
          if (shouldInsertRow) {
            Transforms.insertNodes(
              editor,
              {
                type: 'paragraph',
                children: [{ text: '' }],
                id: Id.getId()
              },
              {
                at: [editor.children.length]
              }
            )
          }
          e.preventDefault()

          setTimeout(() => {
            Transforms.select(editor, Editor.start(editor, [editor.children.length - 1]))
            ReactEditor.focus(editor)
          })
        }
      }
      scrollElement.addEventListener('pointerdown', clickHandler)
      return () => {
        scrollElement.removeEventListener('pointerdown', clickHandler)
      }
    }
  }, [])
}

export default useAutoInsertEndline
