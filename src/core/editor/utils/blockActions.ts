import { toast } from 'react-hot-toast'
import { CustomEditor, CustomElement } from '~/typings'
import { ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP, SELECTED_BLOCKS_MAP } from '../weakMaps'
import { Editor, Node, Transforms } from 'slate'
import { ReactEditor } from '../slate-react'
import { EDITOR_TO_KEY_TO_ELEMENT } from '../slate-react/utils/weak-maps'
import { css, keyframes } from '@emotion/css'

export const goToBlock = async (blockId: number, editor: CustomEditor) => {
  await waitForEditorContentInitialized(editor)
  return new Promise(res => {
    let path = ID_TO_PATH_MAP.get(editor)?.get(blockId)
    if (!path) {
      const eles = Node.elements(editor)
      for (const ele of eles) {
        if (ele[0].id === blockId) {
          path = ele[1]
          break
        }
      }
    }
    if (!path) {
      toast.error('Can not find target block!')
      return
    }
    const outermostBlock = Editor.node(editor, [path[0]])[0]
    console.log(outermostBlock)
    if ((outermostBlock as CustomElement).hide) {
      const { leftIndex, rightIndex } = findNearHidenBlocks(path[0], editor.children as CustomElement[])
      Transforms.setNodes(
        editor,
        { hide: false },
        {
          at: Editor.range(editor, [leftIndex + 1], [rightIndex])
        }
      )
      Transforms.setNodes(
        editor,
        {
          folded: false
        },
        {
          at: [leftIndex]
        }
      )
    }

    setTimeout(() => {
      const visibleBlocks = editor.children.filter(i => !(i as CustomElement).hide)
      const blockIndex = visibleBlocks.findIndex(i => (i as CustomElement).id === outermostBlock.id)
      editor.virtualizer.scrollToIndex(blockIndex, { align: 'start' })
      console.log(blockIndex)
      alignBlockAtCenter(outermostBlock.id, editor).then(() => res(null))
    })
  })
}

export const waitForEditorContentInitialized = (editor: CustomEditor) => {
  return new Promise(res => {
    const currTime = Date.now()
    const loop = () => {
      if (Date.now() - currTime > 5000) {
        return
      }
      if (editor.contentInitialized) {
        res(null)
      } else {
        requestIdleCallback(loop)
      }
    }
    loop()
  })
}
export const alignBlockAtCenter = (blockId: number, editor: CustomEditor) => {
  return new Promise(res => {
    const currTime = Date.now()
    const editorNode = ReactEditor.toDOMNode(editor, editor)
    const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor)
    const loop = () => {
      // timeout: 3s
      if (Date.now() - currTime > 3000) return
      const blockPath = ID_TO_PATH_MAP.get(editor)?.get(blockId)
      if (!blockPath) {
        requestIdleCallback(loop)
        return
      }
      const block = Editor.node(editor, blockPath)

      const blockNode = KEY_TO_ELEMENT?.get(ReactEditor.findKey(editor, block[0])) as HTMLElement | undefined
      const scrollWrapper = editorNode.parentElement?.parentElement
      if (blockNode && scrollWrapper) {
        const offset =
          blockNode.offsetTop + (editor.titleEle?.getBoundingClientRect().height || 0) - scrollWrapper.getBoundingClientRect().height / 2
        editor.virtualizer.scrollToOffset(offset)
        console.log(offset)
        res(null)
      } else {
        requestIdleCallback(loop)
      }
    }
    loop()
  })
}
export const selectBlock = (blockId: number, editor: CustomEditor) => {
  goToBlock(blockId, editor).then(() => {
    SELECTED_BLOCKS_MAP.get(editor)?.set(blockId, null)
    ID_TO_ELEMENTS_MAP.get(editor)?.get(blockId)?.selectBlock()
  })
}

const blinkOutline = keyframes({
  '0%': {
    outline: '3px solid #F3E99F'
  },
  '100%': {
    outline: '3px solid transparent'
  }
})
export const highlightClassName = css({
  animation: `${blinkOutline} 0.8s infinite`,
  animationDirection: 'alternate',
  borderRadius: 4,
  width: 'fit-content !important'
})
export const highlightBlock = (blockId: number, editor: CustomEditor) => {
  const editorNode = ReactEditor.toDOMNode(editor, editor)
  const block = editorNode.querySelector(`[id='${blockId}']`)
  if (block) {
    block.classList.add(highlightClassName)
    setTimeout(() => {
      block.classList.remove(highlightClassName)
    }, 5600)
  }
}
export const highlightMeta = (elementId: number, editor: CustomEditor) => {
  const editorNode = ReactEditor.toDOMNode(editor, editor)
  const meta = editorNode.querySelector(`[data-meta-id='${elementId}']`)
  if (meta) {
    meta.classList.add(highlightClassName)
    setTimeout(() => {
      meta.classList.remove(highlightClassName)
    }, 5600)
  }
}
export const highlightHeading = (headingId: number) => {

}
const findNearHidenBlocks = (centerBlockIndex: number, eles: CustomElement[]) => {
  let leftIndex = centerBlockIndex
  let rightIndex = centerBlockIndex
  while (leftIndex) {
    leftIndex -= 1
    const currentEle = eles[leftIndex]
    if ('type' in currentEle && currentEle.type.startsWith('heading')) {
      break
    }
  }
  while (rightIndex < eles.length - 1) {
    rightIndex += 1
    const currentEle = eles[rightIndex]
    if ('type' in currentEle && currentEle.type.startsWith('heading')) {
      break
    }
  }
  const allEles = eles.slice(leftIndex, rightIndex)
  return {
    allEles,
    leftIndex,
    rightIndex
  }
}
