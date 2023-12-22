import { toast } from 'react-hot-toast'
import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import { ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP } from '../weakMaps'
import { Editor, Node, Transforms } from 'slate'
import { ReactEditor } from '../slate-react'
import { EDITOR_TO_KEY_TO_ELEMENT } from '../slate-react/utils/weak-maps'
import { css, keyframes } from '@emotion/css'
import { waitFor } from '@/utils/functions'
import { HeadingToLevel } from '@/core/components/editor/elements/Heading'
import { Colors } from '@/consts'

export const goToBlock = async (blockId: number, editor: CustomEditor) => {
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

    if ((outermostBlock as CustomElement).hide) {
      const { leftIndex, rightIndex } = findNearHidenBlocks(path[0], editor.children as CustomElement[])
      Transforms.setNodes(
        editor,
        { hide: false, folded: false },
        {
          at: Editor.range(editor, [leftIndex], [rightIndex - 1])
        }
      )
      Transforms.setNodes(editor, { hide: false }, { at: [rightIndex] })
    }

    setTimeout(() => {
      const visibleBlocks = editor.children.filter(i => !(i as CustomElement).hide)
      const blockIndex = visibleBlocks.findIndex(i => (i as CustomElement).id === outermostBlock.id)
      console.log('scrolling')
      editor.virtualizer.scrollToIndex(blockIndex, { align: 'center' })
      setTimeout(() => {
        res(null)
      }, 100)
    })
  })
}

export const waitForEditorContentInitialized = (editor: CustomEditor) => {
  return new Promise(res => {
    waitFor(
      () => !!editor.contentInitialized,
      () => res(null)
    )
  })
}

export const selectBlock = (blockId: number, instance: IEditorInstance) => {
  const editor = instance.getSlateEditor?.()
  if (!editor) return
  console.log(blockId)
  goToBlock(blockId, editor).then(() => {
    instance.values.selectedBlocks.set(blockId, {})
    ID_TO_ELEMENTS_MAP.get(editor)?.get(blockId)?.selectBlock()
  })
}

export const highlightClassName = css({
  background: '#f3e99f2e',
  outline: `3px solid ${Colors.Emphasis.Emphasis}`,
  borderRadius: 4
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
const findNearHidenBlocks = (centerBlockIndex: number, eles: CustomElement[]) => {
  const centerBlock = eles[centerBlockIndex]
  // 当前块为标题，如果展开需要把前面所有的标题都展开
  if (centerBlock.type.startsWith('heading')) {
    const centerBlockLevel = HeadingToLevel[centerBlock.type]
    let leftIndex = centerBlockIndex
    let rightIndex = centerBlockIndex
    // 这里和普通块一样
    while (rightIndex < eles.length - 1) {
      rightIndex += 1
      const currentEle = eles[rightIndex]
      if ('type' in currentEle && currentEle.type.startsWith('heading')) {
        break
      }
    }
    while (leftIndex) {
      leftIndex -= 1
      const currentEle = eles[leftIndex]
      if ('type' in currentEle && currentEle.type.startsWith('heading')) {
        const currHeadingLevel = HeadingToLevel[currentEle.type]
        if (currHeadingLevel > centerBlockLevel) {
          break
        }
      }
    }
    const allEles = eles.slice(leftIndex, rightIndex)
    return {
      allEles,
      leftIndex,
      rightIndex
    }
  } else {
    // 当前块为普通块，仅需要展开到上个标题至下个标题
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
}
