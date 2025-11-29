import { memo, RefObject, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Descendant, Editor, Element as SlateElement, Path, Range, Selection } from 'slate'

import ElementComponent from './element'

import { ReactEditor } from '../plugin/react-editor'
import { useSlateStatic } from '../hooks/use-slate-static'
import { NODE_TO_INDEX, NODE_TO_PARENT } from '../utils/weak-maps'
import { RenderElementProps, RenderLeafProps } from './editable'
import { useVirtualizer, Range as VirtualRange, defaultRangeExtractor } from '@/components'
import { EditorStateAtom } from '../hooks/useEditorState'
import { useUpdate } from 'react-use'
import { selectAtom } from 'jotai/utils'
import { isEqual } from 'lodash'
import { useAtomValue } from 'jotai'
import { useDecorate } from '../slate-react/hooks/use-decorate'
import { CustomEditor, CustomElement } from '~/typings'

/**
 * Children.
 */

const stateAtom = selectAtom(
  EditorStateAtom,
  s => ({
    disableOverscanInReadOnly: s.layout?.disableOverscanInReadOnly,
    v: s.layout?.virtualizer,
    overscan: s.layout?.overscan,
    textareaMode: s.textboxMode,
    showPaddingBottom: s.layout?.showBottomPadding,
    bottomPadding: s.styles?.bottomPadding
  }),
  isEqual
)

type IFirstLayer = {
  visible: CustomElement[]
  firstLayerMap: Map<number, number>
  firstLayerNotHiddenMap: Map<number, number>
}
const VirtualChildren = memo(
  (props: {
    decorations: Range[]
    children: Descendant[]
    renderElement?: (props: RenderElementProps) => JSX.Element
    renderLeaf?: (props: RenderLeafProps) => JSX.Element
    selection: Range | null
    scrollElement: RefObject<HTMLElement | null>
    readOnly?: boolean
    parentElement?: RefObject<HTMLElement | null>
  }) => {
    const { decorations, renderElement, renderLeaf, selection, children, scrollElement, readOnly, parentElement } = props
    const editor = useSlateStatic()
    const update = useUpdate()
    // sometimes children rerendered earlier than onChange, idk why but we need to trigger onChange to reindex here.
    // TODO: fix this earlier rerender triggered in editable
    if (editor.changeHandled !== true) {
      editor.onChange?.()
      update()
    }

    const visibleChildren = useMemo(() => {
      const firstLayerMap = new Map<number, number>()
      const firstLayerNotHiddenMap = new Map<number, number>()
      const visible: Descendant[] = []
      ;(children as CustomElement[]).forEach((c, idx) => {
        if (!c.hide) {
          visible.push(c)
          firstLayerNotHiddenMap.set(c.id, visible.length)
        }
        firstLayerMap.set(c.id, idx)
      })
      return {
        visible,
        firstLayerMap,
        firstLayerNotHiddenMap
      }
    }, [children]) as IFirstLayer
    const { disableOverscanInReadOnly = true, v, bottomPadding, textareaMode, overscan: o = 5, showPaddingBottom } = useAtomValue(stateAtom)
    const disableVirtualizer = v === false
    const overscan = disableVirtualizer || (readOnly && disableOverscanInReadOnly) ? editor.children.length : o
    useEffect(() => {
      update()
    }, [])
    const paddingEnd = showPaddingBottom !== false ? bottomPadding || 200 : 0
    return !disableVirtualizer ? (
      <Virtual
        container={scrollElement}
        decorations={decorations}
        selection={selection}
        overscan={overscan}
        paddingEnd={paddingEnd}
        children={visibleChildren}
        editor={editor}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        parentElement={parentElement}
      />
    ) : (
      <NotVirtual
        decorations={decorations}
        selection={selection}
        textareaMode={textareaMode}
        paddingEnd={paddingEnd}
        children={visibleChildren}
        editor={editor}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        parentElement={parentElement}
      />
    )
  },
  (prev, curr) =>
    prev.selection === curr.selection &&
    prev.children === curr.children &&
    prev.scrollElement === curr.scrollElement &&
    prev.readOnly === curr.readOnly &&
    prev.parentElement === curr.parentElement &&
    prev.decorations === curr.decorations
)

const Virtual = memo(
  ({
    children,
    container,
    overscan,
    paddingEnd,
    selection,
    editor,
    renderElement,
    renderLeaf,
    decorations,
    parentElement
  }: {
    children: IFirstLayer
    container: RefObject<HTMLElement | null>
    overscan: number
    paddingEnd: number
    selection: Selection
    editor: CustomEditor
    renderElement?: (props: RenderElementProps) => JSX.Element
    renderLeaf?: (props: RenderLeafProps) => JSX.Element
    decorations: Range[]
    parentElement?: RefObject<HTMLElement | null>
  }) => {
    const [titleHeight, setTitleHeight] = useState<number>(0)
    useLayoutEffect(() => {
      if (editor.titleEle) {
        setTitleHeight(Math.round(editor.titleEle.offsetHeight))
        const observer = new ResizeObserver(entry => {
          setTitleHeight(Math.round(entry[0].borderBoxSize[0].blockSize))
        })
        observer.observe(editor.titleEle)
        return () => {
          observer.disconnect()
        }
      }
    }, [editor.titleEle])
    let rangeExtractor: ((r: VirtualRange) => number[]) | undefined = undefined
    const firstLayerMap = children.firstLayerNotHiddenMap
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
    const virtualizer = useVirtualizer({
      count: children.visible.length,
      estimateSize: () => 30,
      getScrollElement: () => container.current,
      overscan,
      paddingEnd,
      rangeExtractor: rangeExtractor || defaultRangeExtractor,
      scrollMargin: titleHeight,
      getItemKey: index => {
        const item = children.visible[index]
        return item.id
      },
      measureElement: (ele, entry) => {
        let size: number
        if (entry) {
          size = Math.round(entry.borderBoxSize[0].blockSize)
        } else {
          size = Math.round((ele as HTMLElement).offsetHeight)
        }
        const computed = window.getComputedStyle(ele)
        const marginTop = parseInt(computed.marginTop)
        const marginBottom = parseInt(computed.marginBottom)
        const totalSize = size + marginTop + marginBottom
        return Math.round(totalSize)
      }
    })
    editor.virtualizer = virtualizer
    const virtualItems = virtualizer.getVirtualItems()
    const first = virtualItems[0]
    const totalSize = virtualizer.getTotalSize()
    const parentEle = parentElement?.current

    if (parentEle) {
      const currentStyle = parentEle.style
      const renderContainer = parentEle.parentElement
      if (currentStyle.paddingBottom) {
        currentStyle.removeProperty('padding-bottom')
      }
      if (renderContainer) {
        renderContainer.style.height = `${totalSize}px`
      }
      if (first) {
        currentStyle.transform = `translateY(${first.start - titleHeight}px)`
      }
    }
    return virtualItems.map(row => {
      if (!row) return null
      const { index, key } = row
      const element = children.visible[index]
      return (
        <VirtualItem
          measureElement={virtualizer.measureElement}
          index={index}
          key={key}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          decorations={decorations}
          editor={editor}
          element={element}
          selection={selection}
          firstLayerPathMap={children.firstLayerMap}
        />
      )
    })
  }
)
const NotVirtual = memo(
  ({
    children,
    paddingEnd,
    selection,
    editor,
    renderElement,
    renderLeaf,
    decorations,
    parentElement,
    textareaMode
  }: {
    children: IFirstLayer
    paddingEnd: number
    selection: Selection
    editor: CustomEditor
    renderElement?: (props: RenderElementProps) => JSX.Element
    renderLeaf?: (props: RenderLeafProps) => JSX.Element
    decorations: Range[]
    parentElement?: RefObject<HTMLElement | null>
    textareaMode?: boolean
  }) => {
    const parentEle = parentElement?.current
    if (parentEle) {
      const renderContainer = parentEle.parentElement
      if (!textareaMode) {
        const parentEle = parentElement?.current
        if (parentEle) {
          if (renderContainer && renderContainer.style['height']) {
            renderContainer.style.removeProperty('height')
          }
          parentEle.style['transform'] && parentEle.style.removeProperty('transform')
          if (paddingEnd !== undefined) {
            parentEle.style.paddingBottom = `${paddingEnd}px`
          }
        }
      }
    }
    return children.visible.map(i => (
      <VirtualItem
        key={i.id}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        decorations={decorations}
        element={i}
        firstLayerPathMap={children.firstLayerMap}
        editor={editor}
        selection={selection}
      />
    ))
  }
)
const VirtualItem = memo(
  ({
    element,
    selection,
    decorations,
    renderElement,
    renderLeaf,
    editor,
    index,
    measureElement,
    firstLayerPathMap
  }: {
    element: CustomElement
    selection: Selection
    decorations: Range[]
    index?: number
    measureElement?: (ref: HTMLElement | null) => void
    renderElement?: (props: RenderElementProps) => JSX.Element
    renderLeaf?: (props: RenderLeafProps) => JSX.Element
    editor: CustomEditor
    firstLayerPathMap: Map<number, number>
  }) => {
    const decorate = useDecorate()
    const path = [firstLayerPathMap.get(element.id)] as Path

    if (path[0] === undefined) return null
    try {
      const key = ReactEditor.findKey(editor, element)
      const range = Editor.range(editor, path)
      const sel = selection && Range.intersection(range, selection)
      const ds = decorate([element, path])
      for (const dec of decorations) {
        const d = Range.intersection(dec, range)
        if (d) {
          ds.push(d)
        }
      }
      NODE_TO_INDEX.set(element, path[0])
      NODE_TO_PARENT.set(element, editor)

      if (SlateElement.isElement(element)) {
        return (
          <ElementComponent
            decorations={ds}
            element={element}
            key={key.id}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            selection={sel}
            index={index}
            measureElement={measureElement}
          />
        )
      }
    } catch (e) {
      console.log(e, path)
    }
    return null
  },
  (prev, curr) =>
    prev.index === curr.index &&
    prev.element === curr.element &&
    prev.decorations === curr.decorations &&
    prev.renderElement === curr.renderElement &&
    prev.selection === curr.selection
)

export default memo(VirtualChildren)
