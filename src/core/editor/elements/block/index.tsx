import { useMemoizedFn, useMergedRef, usePrevious, useUpdateEffect } from '@/hooks'
import classNames from 'classnames'
import { FC, memo, useRef, useState, useEffect, cloneElement, MouseEvent, useCallback, RefObject, useLayoutEffect } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { CustomElement } from '~/typings'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './index.module.less'
import './index.less'
import { SELECT_AREA_MAP, ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from '../../weakMaps'
import useIsSelecting from '../../hooks/useIsSelecting'
import { getDistanceBetweenElementAndScrollableElement } from '@/core/editor/utils/scroll'
import { isRectsCollision } from '../../utils/positions/collision'
import { css } from '@emotion/css'
import { hexToRgb } from '@/utils/color'
import { useGlobalIsDragging } from '@/core'
import { Editor, Node, Path, Range, Transforms } from 'slate'
import { NODE_TO_PARENT } from '../../slate-react/utils/weak-maps'
import { useAtomValue } from 'jotai'
import { EditorSearchAtom, SearchOccurrence } from '../../hooks/useEditorSearch'
import { CustomText } from '~/typings/editor/baseTypes'

type BlockProps = {
  blockId: number
  type?: string
  ratio?: number
  onMouseEnter?: (e: MouseEvent, element: CustomElement) => void
  onMouseLeave?: (e: MouseEvent, element: CustomElement) => void
  onMouseMove?: (e: MouseEvent, element: CustomElement) => void
  element?: CustomElement
  scrollElementRef?: RefObject<HTMLElement>
}

const CardBlocks = ['pdf', 'book-highlight', 'note']

const PrimaryHighlight = 'primary-highlight'
const SecondaryHighlight = 'secondary-highlight'
const Block: FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & BlockProps & RenderElementProps> = memo(
  ({ scrollElementRef, blockId, children, ratio, type, attributes, element, onMouseEnter, onMouseLeave, onMouseMove, ...rest }) => {
    const blockRef = useRef<HTMLDivElement>(null)
    const columnRef = useRef<HTMLDivElement>(null)
    const editor = useSlateStatic()
    const map = ID_TO_ELEMENTS_MAP.get(editor)
    const mergedChildrenRef = useMergedRef(blockRef, attributes.ref)
    const [selected, setSelected] = useState(false)
    const [isSelecting] = useIsSelecting()
    const [isGlobalDragging] = useGlobalIsDragging()
    const editorSearch = useAtomValue(EditorSearchAtom)
    const distanceToScrollElementRef = useRef<{ left: number; top: number; right: number; bottom: number }>()
    const previousElement = usePrevious(element)
    const getSearchEntries = (): SearchOccurrence[] | undefined => {
      if (editorSearch.entryCache?.[blockId] && previousElement === element) return editorSearch.entryCache[blockId]
      const query = editorSearch.query
      if (!query) return
      if (!editorSearch.entryCache) editorSearch.entryCache = {}
      const textEntries = Array.from(Node.texts(element))
      const withLengthEntries: {
        text: CustomText
        path: Path
        totalLength: number
        startLength: number
      }[] = []
      textEntries.forEach((e, idx, arr) => {
        if (idx === 0) {
          withLengthEntries.push({
            text: e[0],
            path: e[1],
            totalLength: e[0].text.length,
            startLength: 0
          })
        } else {
          const prev = withLengthEntries[idx - 1]
          withLengthEntries.push({
            text: e[0],
            path: e[1],
            totalLength: e[0].text.length,
            startLength: prev.startLength + prev.totalLength
          })
        }
      })
      const text = Node.string(element)
      const indexes = [...text.matchAll(new RegExp(query, 'gi'))].map(i => i.index).filter(i => i !== undefined) as number[]
      const entries = indexes
        .map(i => {
          const startIndex = i
          const endIndex = i + query.length
          const startEntry = withLengthEntries.findLast(i => i.startLength <= startIndex)
          const endEntry = withLengthEntries.findLast(i => i.startLength <= endIndex)
          if (!startEntry || !endEntry) return
          const startOffset = startIndex - startEntry.startLength
          const endOffset = endIndex - endEntry.startLength
          return {
            startEntry,
            endEntry,
            startOffset,
            endOffset
          }
        })
        .filter(i => i) as SearchOccurrence[]
      editorSearch.entryCache[blockId] = entries
      return entries
    }
    useEffect(() => {
      if (editorSearch.results?.[blockId] && editorSearch.query && editorSearch.isSearching !== false) {
        const entries = getSearchEntries()
        if (entries) {
          const currentOccur = editorSearch.currentOccurrence
          const currentBlockPath = ReactEditor.findPath(editor, element)
          const secondaryHighlightArr = Array.from(CSS.highlights.get(SecondaryHighlight)?.values() || [])
          entries.forEach((entry, idx) => {
            const range = ReactEditor.toDOMRange(editor, {
              anchor: {
                offset: entry.startOffset,
                path: [...currentBlockPath, ...entry.startEntry.path]
              },
              focus: {
                path: [...currentBlockPath, ...entry.endEntry.path],
                offset: entry.endOffset
              }
            })
            Object.assign(range, {
              index: idx,
              blockId
            })
            const alreadyExistSecondaryHighlightRange = secondaryHighlightArr.find(i => i.index === idx && i.blockId === blockId)
            if (currentOccur?.blockId === blockId) {
              if (currentOccur.idx === idx) {
                const highlight = new Highlight()
                highlight.add(range)
                CSS.highlights.set(PrimaryHighlight, highlight)
                if (alreadyExistSecondaryHighlightRange) {
                  console.log(alreadyExistSecondaryHighlightRange)
                  const set = CSS.highlights.get(SecondaryHighlight)
                  set?.delete(alreadyExistSecondaryHighlightRange)
                  CSS.highlights.set(SecondaryHighlight, set)
                }
                return
              }
            }
            if (!alreadyExistSecondaryHighlightRange) {
              const highlight = CSS.highlights.get(SecondaryHighlight) || new Highlight()
              highlight.add(range)
              CSS.highlights.set(SecondaryHighlight, highlight)
            }
          })
        }
      }
      return () => {
        const primary = CSS.highlights.get(PrimaryHighlight)
        primary?.forEach(i => {
          if (i.blockId === blockId) {
            primary.delete(i)
          }
        })
        const set = CSS.highlights.get(SecondaryHighlight)
        set?.forEach(i => {
          if (i.blockId === blockId) {
            set?.delete(i)
          }
        })
      }
    }, [editorSearch, element])

    const handleCollisionSelectBlock = useMemoizedFn(() => {
      if (type === 'column' || type === 'columnList') return
      const selectArea = SELECT_AREA_MAP.get(editor)
      if (!selectArea || !distanceToScrollElementRef.current) return
      if (isRectsCollision(selectArea, distanceToScrollElementRef.current)) {
        setSelected(true)
      } else {
        setSelected(false)
      }
    })

    const handleGlobalClick = useMemoizedFn(e => {
      if (!isSelecting && selected) {
        if (!blockRef.current?.contains(e.target)) {
          setSelected(false)
        }
      }
    })

    useLayoutEffect(() => {
      document.addEventListener('click', handleGlobalClick)
      const selectedBlocksMap = SELECTED_BLOCKS_MAP.get(editor)
      if (selectedBlocksMap?.has(blockId)) {
        setSelected(true)
      }
      return () => {
        document.removeEventListener('click', handleGlobalClick)
        try {
          const path = ReactEditor.findPath(editor, element)
          if (editor.selection && Range.includes(editor.selection, path)) {
            const currentPathEle = Editor.node(editor, path)
            // maybe deleted
            if (currentPathEle[0] === element) {
              ReactEditor.deselect(editor)
            }
          }
        } catch (e) {
          console.error(e)
        }
      }
    }, [])

    useUpdateEffect(() => {
      const selectedBlocksMap = SELECTED_BLOCKS_MAP.get(editor)
      if (selected) {
        selectedBlocksMap?.set(blockId, blockRef.current)
      } else {
        selectedBlocksMap?.delete(blockId)
      }
    }, [selected])

    const getIndicatorPosition = (
      direction: 'top' | 'left' | 'bottom' | 'right'
    ):
      | {
          left: number
          top: number
          width: number
          height: number
        }
      | undefined => {
      const blockBound = blockRef.current?.getBoundingClientRect()
      if (blockBound) {
        const { left: bleft, top: btop, width: bwidth, height: bheight } = blockBound
        switch (direction) {
          case 'top':
            return {
              left: bleft,
              top: btop - 4,
              width: bwidth,
              height: 4
            }
          case 'bottom':
            return {
              left: bleft,
              top: btop + bheight,
              height: 4,
              width: bwidth
            }
          case 'left':
            return {
              width: 4,
              height: bheight,
              left: bleft - 4,
              top: btop
            }
          case 'right':
            return {
              width: 4,
              height: bheight,
              left: bleft + bwidth,
              top: btop
            }
        }
      }
    }

    const selectBlock = useMemoizedFn(() => {
      setSelected(true)
    })

    useEffect(() => {
      if (element.type === 'column') {
        const width = `calc(( 100% - ${
          46 * ((columnRef.current?.parentElement?.querySelectorAll("[data-type='column']").length || 2) - 1)
        }px ) * ${ratio?.toFixed(3)})`
        if (columnRef.current) {
          columnRef.current.style.width = width
        }
      }
    }, [ratio])

    useLayoutEffect(() => {
      if (isSelecting) {
        const block = blockRef.current
        if (block && scrollElementRef?.current) {
          distanceToScrollElementRef.current = getDistanceBetweenElementAndScrollableElement(block, scrollElementRef.current)
        }
      }
      map?.set(blockId, {
        selectBlock,
        collisionSelectBlock: handleCollisionSelectBlock,
        getElement: () => element,
        getIndicatorPosition,
        getClientBound: () => blockRef.current?.getBoundingClientRect(),
        removeSelf: () => {
          const path = ReactEditor.findPath(editor, element)
          Transforms.removeNodes(editor, {
            at: path
          })
        },
        getPath: () => ReactEditor.findPath(editor, element)
      })
      return () => {
        map?.delete(blockId)
      }
    })

    const handleMouseEnter = useCallback(e => onMouseEnter?.(e, element), [onMouseEnter, element])
    const handleMouseLeave = useCallback(e => onMouseLeave?.(e, element), [onMouseLeave, element])
    const handleMouseMove = useCallback(
      e => {
        if (NODE_TO_PARENT.get(element)?.type === 'tableCell') {
          e.stopPropagation()
        }
        onMouseMove?.(e, element)
      },
      [onMouseMove, element]
    )

    const { background, color, align, cardType } = element
    const linearBg = background && (background as string).startsWith('linear-gradient')
    const rgbaBg = background && hexToRgb(background)
    const linearFont = color && (color as string).startsWith('linear-gradient')
    const renderChildren = () => (
      <div
        key={blockId}
        {...attributes}
        ref={mergedChildrenRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMoveCapture={handleMouseMove}
        suppressContentEditableWarning
        data-level={element?.level}
        style={{
          textAlign: align,
          '--block-linear-font': linearFont ? color : undefined,
          '--text-fill': linearFont ? 'transparent' : undefined,
          '--block-rgb-bg': !linearBg && rgbaBg ? `${rgbaBg.r},${rgbaBg.g},${rgbaBg.b}` : undefined,
          '--block-linear-bg': linearBg ? background : undefined,
          '--block-font-color': linearFont ? undefined : color,
          color: 'var(--block-font-color)',
          margin: type === 'table' ? '0px -10px' : undefined,
          padding: type === 'table' ? '0px 12px 10px' : undefined,
          ...rest.style
        }}
        className={classNames(
          'BlockCommon',
          type === 'columnList' && styles.ColumnListBlock,
          type === 'column' && styles.ColumnBlock,
          type?.startsWith('heading') && styles.HeadingBlock,
          type === 'block-quote' && styles.BlockquoteBlock,
          cardType === 'slim' && styles.SlimCardBlock,
          cardType === 'line' && styles.LineCardBlock,
          (cardType === 'wide' || (CardBlocks.includes(type) && cardType === undefined)) && styles.WideCardBlock,
          type !== 'column' && type !== 'columnList' && !type?.startsWith('heading') && 'ParagraphBlock',
          isGlobalDragging &&
            css({
              pointerEvents: 'auto'
            })
        )}
        {...rest}
      >
        {children}
        <AnimatePresence>
          {selected && (
            <motion.div
              transition={{ duration: 0.2 }}
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.Selected}
            ></motion.div>
          )}
        </AnimatePresence>
      </div>
    )

    return type === 'column'
      ? cloneElement(
          <div></div>,
          {
            ref: columnRef,
            style: {
              paddingTop: 12,
              paddingBottom: 12,
              flexGrow: 1,
              flexShrink: 0
            },
            role: 'column'
          },
          renderChildren()
        )
      : renderChildren()
  }
)

export default Block
