import { Editor, Node } from 'slate'
import { goToBlock } from './blockActions'
import { CustomEditor, CustomElement } from '~/typings'
import { css } from '@emotion/css'
import { ReactEditor } from '../slate-react'
import { Colors } from '@/consts'

export const blinkBg = css({
  backgroundColor: `${Colors.Emphasis.Emphasis}`
})

export const blinkHighlights = (containerEle: HTMLElement, highlightId: number) => {
  const highlights = containerEle.querySelectorAll(`[data-highlight='${highlightId}']`)
  highlights.forEach(i => {
    i.classList.add(blinkBg)
  })
  setTimeout(() => {
    highlights.forEach(i => {
      i.classList.remove(blinkBg)
    })
  }, 3000)
}

export const goToTextHighlight = (highlightId: number, editor: CustomEditor) => {
  const iter = Node.texts(editor)
  for (const value of iter) {
    if (value && 'highlight' in value[0] && value[0].highlight === highlightId) {
      const [v, path] = value
      const outermostBlock = Editor.node(editor, [path[0]])[0] as CustomElement
      if (path) {
        goToBlock(outermostBlock.id, editor).then(() => {
          blinkHighlights(ReactEditor.toDOMNode(editor, editor), highlightId)
        })
      }
      break
    }
  }
}
