import Id from './utils/id'
import { RefObject, useEffect } from 'react'
import { Editor, Transforms } from 'slate'
import { CustomEditor } from '~/typings'
import { ReactEditor } from '@/core'

const useAutoInsertEndline = (scrollElementRef: RefObject<HTMLElement>, editor: CustomEditor) => {
  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (scrollElement) {
      const clickHandler = (e: MouseEvent) => {
        const textbox = scrollElementRef.current?.querySelector('[role="textbox"]')
        const lastEleRect = textbox?.querySelectorAll('[data-slate-node]').values().toArray().at(-1)?.getBoundingClientRect()
        const lastEle = editor.children[editor.children.length - 1]
        const shouldInsertRow =
          lastEle.hide || !(lastEle.type === 'paragraph' && lastEle.children.length === 1 && lastEle.children[0].text === '')
        console.log(lastEle, shouldInsertRow, lastEleRect, e.clientY)
        if (lastEleRect && e.clientY > lastEleRect.bottom) {
          if (shouldInsertRow) {
            e.preventDefault()
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
