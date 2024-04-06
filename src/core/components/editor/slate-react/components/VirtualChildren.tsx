import { memo, RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Descendant, Editor, Element as SlateElement, Range, Selection } from 'slate'

import ElementComponent from './element'

import { ReactEditor } from '../plugin/react-editor'
import { useSlateStatic } from '../hooks/use-slate-static'
import { NODE_TO_INDEX, NODE_TO_PARENT } from '../utils/weak-maps'
import { RenderElementProps, RenderLeafProps, RenderPlaceholderProps } from './editable'
import { useVirtualizer, Range as VirtualRange, defaultRangeExtractor } from '@tanstack/react-virtual'
import { EDITOR_TO_CHANGED, ID_TO_FIRST_LAYER_EXCEPET_HIDEN_MAP, ID_TO_FIRST_LAYER_MAP } from '../../weakMaps'
import { useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { assignProperties } from '@/utils'
import { useUpdate } from 'react-use'

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
    const update = useUpdate()
    // sometimes children rerendered earlier than onChange, idk why but we need to trigger onChange to reindex here.
    // TODO: fix this earlier rerender triggered in editable
    if (EDITOR_TO_CHANGED.get(editor) !== true) {
      editor.onChange?.()
      update()
    }

    const visibleChildren = useMemo(() => {
      return children.filter(i => !i.hide)
    }, [children])
    const disableOverscanInReadOnly = useSelectAtomValue(EditorStateAtom, s => s.layout?.disableOverscanInReadOnly) ?? true
    const v = useSelectAtomValue(EditorStateAtom, s => s.layout?.virtualizer)
    const textareaMode = useSelectAtomValue(EditorStateAtom, s => s.textboxMode)
    const disableVirtualizer = v === false

    const overscan = disableVirtualizer || (readOnly && disableOverscanInReadOnly) ? editor.children.length : 5
    const instance = useEditorInstance()

    assignProperties(instance, {
      getScrollPosition: () => {
        return virtualizer.scrollOffset
      },
      scrollToPosition: offset => {
        if (offset === 0) {
          virtualizer.scrollToOffset(0, { align: 'auto', behavior: 'auto' })
          return
        }
        virtualizer.scrollToOffset(offset)
      }
    })

    let rangeExtractor: ((r: VirtualRange) => number[]) | undefined = undefined
    const firstLayerMap = ID_TO_FIRST_LAYER_EXCEPET_HIDEN_MAP.get(editor)!

    if (selection && !Range.isCollapsed(selection)) {
      const start = Range.start(selection)
      const end = Range.end(selection)
      const startIndex = start.path[0]
      // maybe have hiden nodes
      const startNodeRealIndex = firstLayerMap.get(editor.children[startIndex].id) || startIndex
      const endIndex = end.path[0]
      const endNodeRealIndex = firstLayerMap.get(editor.children[endIndex].id) || endIndex
      rangeExtractor = r => {
        const s = Math.max(Math.min(startNodeRealIndex - overscan, r.startIndex - overscan), 0)
        const e = Math.min(Math.max(endNodeRealIndex + overscan, r.endIndex + overscan), editor.children.length)

        const arr = []
        for (let i = s; i <= e; i++) {
          arr.push(i)
        }
        return arr
      }
    }

    const titleHeight = editor.titleEle?.getBoundingClientRect().height || 0
    const showPaddingBottom = useSelectAtomValue(EditorStateAtom, s => s.layout?.showBottomPadding)
    const bottomPadding = useSelectAtomValue(EditorStateAtom, s => s.styles?.bottomPadding)

    const virtualizer = useVirtualizer({
      count: visibleChildren.length,
      estimateSize: () => 30,
      getScrollElement: () => scrollElement?.current,
      overscan,
      paddingEnd: showPaddingBottom !== false ? bottomPadding || 200 : 0,
      // paddingStart: titleHeight,
      rangeExtractor: rangeExtractor || defaultRangeExtractor,
      scrollMargin: titleHeight,
      getItemKey: index => {
        const item = visibleChildren[index]
        return item.id
      },
      measureElement: (ele, entry, instance) => {
        const size = ele.clientHeight
        const marginTop = parseInt(window.getComputedStyle(ele).marginTop)
        const marginBottom = parseInt(window.getComputedStyle(ele).marginBottom)
        const totalSize = size + marginTop + marginBottom
        return Math.round(totalSize)
      }
    })

    editor.virtualizer = virtualizer

    const totalSize = virtualizer.getTotalSize()

    const virtualItems = virtualizer.getVirtualItems()

    const first = virtualItems[0]

    if (!disableVirtualizer) {
      const size = totalSize
      const parentEle = parentElement?.current
      if (parentEle) {
        parentEle.style.removeProperty('padding-bottom')
        parentEle.parentElement!.style.height = `${size}px`
        parentEle.parentElement!.style.minHeight = `${size}px`
        parentEle.style.position = 'absolute'
        parentEle.style.width = '100%'
        parentEle.style.left = '0px'
        parentEle.style.top = '0px'
        if (first) {
          parentEle.style.transform = `translateY(${first.start - titleHeight}px)`
        }
      }
    } else {
      if (!textareaMode) {
        const parentEle = parentElement?.current
        if (parentEle) {
          parentEle.parentElement?.style.removeProperty('height')
          parentEle.parentElement?.style.removeProperty('min-height')
          parentEle.style.removeProperty('transform')
          parentEle.style.removeProperty('position')
          const paddingEnd = showPaddingBottom !== false ? bottomPadding || 200 : 0
          if (paddingEnd) {
            parentEle.style.paddingBottom = `${paddingEnd}px`
          }
        }
      }
    }

    useEffect(() => {
      update()
    }, [])

    return (
      <>
        {/*<div role="virtual-placeholder" contentEditable={false} style={{ height: first?.start - titleHeight, width: '100%' }}></div>*/}
        {!disableVirtualizer
          ? virtualItems.map(row => {
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
            })
          : visibleChildren.map((i, idx) => (
              <VirtualItem
                key={i.id}
                renderPlaceholder={renderPlaceholder}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                index={idx}
                measureElement={virtualizer.measureElement}
                decorations={decorations}
                element={i}
                selection={selection}
              />
            ))}
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
