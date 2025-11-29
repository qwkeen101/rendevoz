import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import { Editor, Node, Transforms } from 'slate'
import { ReactEditor } from '../slate-react'
import { css } from '@emotion/css'
import { HeadingToLevel } from '../elements/Heading'
import { Colors } from '@/consts'
import scrollIntoView from 'scroll-into-view-if-needed'

export const goToBlock = async (blockId: number, editor: CustomEditor, align: 'start' | 'center' = 'center') => {
  return new Promise(res => {
    let path = editor.instance.getElementPathById(blockId)
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
      if (editor.virtualizer?.options.enabled) {
        editor.virtualizer.scrollToIndex(blockIndex, { align: align })
      } else {
        const ele = ReactEditor.toDOMNode(editor, outermostBlock)
        scrollIntoView(ele, {
          block: 'center',
          scrollMode: 'if-needed'
        })
      }
      setTimeout(() => {
        res(null)
      }, 100)
    })
  })
}

export const selectBlock = (blockId: number, instance: IEditorInstance) => {
  const editor = instance.getSlateEditor?.()
  if (!editor) return
  goToBlock(blockId, editor).then(() => {
    instance.values.selectedBlocks.set(blockId, {})
    instance.blockOps?.getBlockFuncs(blockId)?.selectBlock()
  })
}

export const highlightClassName = css({
  background: '#f3e99f2e',
  outline: `3px solid ${Colors.Emphasis.Emphasis}`,
  borderRadius: '4px !important'
})

export const highlightBlock = (blockId: number, editor: CustomEditor) => {
  const instance = editor.instance
  console.log(instance, blockId)
  if (instance) {
    instance.selectBlock?.({ blockId })
    setTimeout(() => {
      instance.blockOps?.getBlockFuncs(blockId)?.deselectBlock()
    }, 2000)
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
    // 这里和普通块一�?
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
