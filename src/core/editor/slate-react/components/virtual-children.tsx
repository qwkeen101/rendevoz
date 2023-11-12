import { memo, RefObject, useEffect, useMemo, useState } from 'react'
import { Descendant, Editor, Element as SlateElement, Range, Selection } from 'slate'

import ElementComponent from './element'

import { ReactEditor } from '../plugin/react-editor'
import { useSlateStatic } from '../hooks/use-slate-static'
import { NODE_TO_INDEX, NODE_TO_PARENT } from '../utils/weak-maps'
import { RenderElementProps, RenderLeafProps, RenderPlaceholderProps } from './editable'
import { useVirtualizer, Range as VirtualRange, defaultRangeExtractor } from '@tanstack/react-virtual'
import { EDITOR_TO_CHANGED, ID_TO_FIRST_LAYER_EXCEPET_HIDEN_MAP, ID_TO_FIRST_LAYER_MAP } from '../../weakMaps'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '@/core/editor/hooks/useEditorState'
import useEditorInstance from '@/core/editor/hooks/useEditorInstance'
import { assignProperties } from '@/utils'

/**
 * Children.
 */

const VirtualChildren = memo(
  (props: {
    decorations: Range[]
    children: Descendant[]
    renderElement?: (props: RenderElementProps) => JSX.Element
    renderPlaceholder: (props: RenderPlaceholderProps) => JSX.Element
    renderLeaf?: (props: RenderLeafProps) => JSX.Element
    selection: Range | null
    scrollElement?: RefObject<HTMLElement | null>
    readOnly?: boolean
    parentElement?: RefObject<HTMLElement | null>
  }) => {
    const { decorations, renderElement, renderPlaceholder, renderLeaf, selection, children, scrollElement, readOnly, parentElement } = props

    const editor = useSlateStatic()

    // sometimes children rerendered earlier than onChange, idk why but we need to trigger onChange to reindex here.
    // TODO: fix this earlier rerender triggered in editable
    if (EDITOR_TO_CHANGED.get(editor) !== true) {
      editor.onChange?.()
    }

    const visibleChildren = useMemo(() => {
      return children.filter(i => !i.hide)
    }, [children])
    const overscan = readOnly ? editor.children.length : 5
    const instance = useEditorInstance()

    assignProperties(instance, {
      getScrollPosition: () => {
        return virtualizer.scrollOffset
      },
      scrollToPosition: offset => {
        if (offset === 0) {
          console.log('yes')

          setTimeout(() => {
            virtualizer.scrollToOffset(0, { align: 'start' })
          })
          return
        }
        virtualizer.scrollToOffset(offset)
      }
    })
    let rangeExtractor: ((r: VirtualRange) => number[]) | undefined = undefined
    const firstLayerMap = ID_TO_FIRST_LAYER_EXCEPET_HIDEN_MAP.get(editor)!
    if (ReactEditor.isFocused(editor) && selection && window.getSelection()?.toString()) {
      const startIndex = selection.anchor.path[0]
      // maybe have hiden nodes
      const startNodeRealIndex = firstLayerMap.get(editor.children[startIndex].id) || startIndex
      const endIndex = selection.focus.path[0]
      const endNodeRealIndex = firstLayerMap.get(editor.children[endIndex].id) || endIndex
      rangeExtractor = r => {
        const s = Math.max(Math.min(startNodeRealIndex - overscan, r.startIndex - overscan), 0)
        const e = Math.min(Math.max(endNodeRealIndex + overscan, r.endIndex + overscan), editor.children.length)
        if (e > r.endIndex || s < r.startIndex) {
          const arr = []
          for (let i = s; i <= e; i++) {
            arr.push(i)
          }
          return arr
        }
        return defaultRangeExtractor(r)
      }
    }

    const titleHeight = editor.titleEle?.getBoundingClientRect().height || 0
    const showPaddingBottom = useSelectAtomValue(EditorStateAtom, s => s.layout?.showBottomPadding)

    const virtualizer = useVirtualizer({
      count: visibleChildren.length,
      estimateSize: () => 30,
      getScrollElement: () => scrollElement?.current || document.body,
      overscan: overscan,
      paddingEnd: showPaddingBottom !== false ? 100 : 0,
      paddingStart: titleHeight,
      rangeExtractor: rangeExtractor || defaultRangeExtractor,
      measureElement: (ele, entry, instance) => {
        if (entry) {
          const size = entry.borderBoxSize[0].blockSize
          const marginTop = parseFloat(window.getComputedStyle(ele).marginTop)
          const marginBottom = parseFloat(window.getComputedStyle(ele).marginBottom)
          const totalSize = size + marginTop + marginBottom
          return totalSize
        }
        const index = instance.indexFromElement(ele)
        const item = instance.measurementsCache[index]
        return item ? item.size : ele.getBoundingClientRect().height
      }
    })

    editor.virtualizer = virtualizer

    const totalSize = virtualizer.getTotalSize()

    if (parentElement?.current) {
      const parentEle = parentElement.current
      if (parentEle) {
        const size = totalSize
        parentEle.style.height = `${size}px`
      }
    }

    const scrollTo = useMemoizedFn(idx => {
      requestIdleCallback(() => {
        if (!(idx >= 0 && idx <= visibleChildren.length - 1)) {
          return
        }
        if (scrollElement?.current) {
          virtualizer.scrollToIndex(idx, { behavior: 'auto' })
        } else {
          scrollTo(idx)
        }
      })
    })

    const virtualItems = virtualizer.getVirtualItems()

    const first = virtualItems[0]

    return (
      <>
        <div role="virtual-placeholder" contentEditable={false} style={{ height: first?.start - titleHeight }}></div>
        {virtualItems.map(row => {
          if (!row) return null
          const { index } = row
          const element = visibleChildren[index]
          return (
            <VirtualItem
              key={element.id}
              renderPlaceholder={renderPlaceholder}
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              index={index}
              measureElement={virtualizer.measureElement}
              decorations={decorations}
              element={element}
              selection={selection}
            />
          )
        })}
      </>
    )
  },
  (prev, curr) =>
    prev.selection === curr.selection &&
    prev.children === curr.children &&
    prev.scrollElement === curr.scrollElement &&
    prev.readOnly === curr.readOnly &&
    prev.parentElement === curr.parentElement
)

const VirtualItem = memo(
  ({
    element,
    selection,
    decorations,
    renderElement,
    renderPlaceholder,
    renderLeaf,
    measureElement,
    index
  }: {
    element: Descendant
    selection: Selection
    decorations: Range[]
    renderElement?: (props: RenderElementProps) => JSX.Element
    renderPlaceholder: (props: RenderPlaceholderProps) => JSX.Element
    renderLeaf?: (props: RenderLeafProps) => JSX.Element
    measureElement: (ele: HTMLElement) => void
    index: number
  }) => {
    const editor = useSlateStatic()
    // const decorate = useDecorate()

    if (element.hide || !element.id) {
      return null
    }
    // get real path from map, row index can't be path
    // first layer path map should be sync with data model
    const path = ID_TO_FIRST_LAYER_MAP.get(editor)?.get(element.id)

    if (!path?.length) return null

    try {
      const key = ReactEditor.findKey(editor, element)
      const range = Editor.range(editor, path)
      const sel = selection && Range.intersection(range, selection)
      // const ds = decorate([element, path])
      // for (const dec of decorations) {
      //   const d = Range.intersection(dec, range)
      //   if (d) {
      //     ds.push(d)
      //   }
      // }
      NODE_TO_INDEX.set(element, path[0])
      NODE_TO_PARENT.set(element, editor)

      if (SlateElement.isElement(element)) {
        return (
          <ElementComponent
            // decorations={ds}
            decorations={[]}
            element={element}
            key={key.id}
            renderElement={renderElement}
            renderPlaceholder={renderPlaceholder}
            renderLeaf={renderLeaf}
            selection={sel}
            innerRef={measureElement}
            index={index}
          />
        )
      }
    } catch (e) {
      console.log(e, path)
    }
    return null
  }
)
export default memo(VirtualChildren)
