import { RefObject, memo, useMemo } from 'react'
import { Editor, Range, Element as SlateElement, Descendant, Selection } from 'slate'

import ElementComponent from './element'

import { ReactEditor } from '../plugin/react-editor'
import { useSlateStatic } from '../hooks/use-slate-static'
import { useDecorate } from '../hooks/use-decorate'
import { NODE_TO_INDEX, NODE_TO_PARENT } from '../utils/weak-maps'
import { RenderElementProps, RenderLeafProps, RenderPlaceholderProps } from './editable'

import { useVirtualizer } from '@tanstack/react-virtual'
import { EDITOR_TO_CHANGED, ID_TO_FIRST_LAYER_MAP } from '../../weakMaps'
import { useMemoizedFn, usePrevious } from '@/hooks'
import useWhyDidYouUpdate from '@/hooks/utils/useWhyUpdate'

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
    if (EDITOR_TO_CHANGED.get(editor) === false) {
      editor.onChange?.()
      console.log('tainted change')
    }

    const visibleChildren = useMemo(() => {
      return children.filter(i => !i.hide)
    }, [children])
    const titleHeight = editor.titleEle?.getBoundingClientRect().height || 0
    const virtualizer = useVirtualizer({
      count: visibleChildren.length,
      estimateSize: idx => 30,
      getScrollElement: () => scrollElement?.current || document.body,
      overscan: readOnly ? editor.children.length : 10,
      paddingEnd: 100,
      paddingStart: titleHeight,
      measureElement: (ele, entry, instance) => {
        if (entry) {
          const size = entry.borderBoxSize[0].blockSize
          const marginTop = parseFloat(window.getComputedStyle(ele).marginTop)
          const totalSize = size + marginTop
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
