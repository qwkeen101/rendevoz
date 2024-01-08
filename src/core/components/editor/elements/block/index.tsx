import { useMergedRef, useSelectAtomValue } from '@/hooks'
import classNames from 'classnames'
import React, { cloneElement, FC, memo, MouseEvent, RefObject, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { CustomElement } from '~/typings'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './index.module.less'
import './index.less'
import { ID_TO_ELEMENTS_MAP } from '../../weakMaps'
import { css } from '@emotion/css'
import { useGlobalIsDragging } from '@/core'
import { Editor, Range, Transforms } from 'slate'
import { NODE_TO_PARENT } from '../../slate-react/utils/weak-maps'
import useBlockContentSearch from '@/core/components/editor/elements/block/useBlockContentSearch'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import useBlockSelect from '@/core/components/editor/elements/block/useBlockSelect'
import { useEditorComposing } from '@/core/components/editor/slate-react/components/editable'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import { Colors } from '@/consts'

type BlockProps = {
  blockId: number
  type?: string
  ratio?: number
  onMouseEnter?: (e: MouseEvent, element: CustomElement) => void
  onMouseLeave?: (e: MouseEvent, element: CustomElement) => void
  onMouseMove?: (e: MouseEvent, element: CustomElement) => void
  element?: CustomElement
  scrollElementRef: RefObject<HTMLElement>
}

const CardBlocks = ['pdf', 'book-highlight', 'note']
const disableOverflowTypes = ['list-item', 'order-list-item', 'table', 'synced', 'column', 'columnList', 'code-block']
const Block: FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & BlockProps & RenderElementProps> = memo(
  ({ scrollElementRef, blockId, children, ratio, type, attributes, element, onMouseEnter, onMouseLeave, onMouseMove, ...rest }) => {
    const blockRef = useRef<HTMLDivElement>(null)
    const columnRef = useRef<HTMLDivElement>(null)
    const editor = useSlateStatic()
    const map = ID_TO_ELEMENTS_MAP.get(editor)
    const mergedChildrenRef = useMergedRef(blockRef, attributes.ref)
    const [isGlobalDragging] = useGlobalIsDragging()
    const instance = useEditorInstance()
    const path = ReactEditor.findPath(editor, element)
    const alwaysShowPlaceholder = useSelectAtomValue(EditorStateAtom, s => s.layout?.alwaysShowPlaceholder)
    useBlockContentSearch(element, instance)
    const isComposing = useEditorComposing()
    const { isSelected, handleCollisionSelectBlock, selectBlock } = useBlockSelect({
      element,
      instance,
      blockRef,
      scrollElementRef
    })

    useLayoutEffect(() => {
      return () => {
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
    const nestedBlocks = ['table']
    let isBlockEmpty = instance.blockOps?.isBlockEmpty(element)

    if (isComposing) {
      if (blockRef.current?.hasAttribute('data-selected')) {
        isBlockEmpty = false
      }
    }

    const renderChildren = () => (
      <div
        key={blockId}
        {...attributes}
        ref={mergedChildrenRef}
        data-empty={isBlockEmpty}
        data-show-placeholder={
          alwaysShowPlaceholder &&
          path.length === 1 &&
          path[0] === 0 &&
          (editor.selection ? Range.isCollapsed(editor.selection) && Range.includes(editor.selection, path) : true)
        }
        onPointerEnter={handleMouseEnter}
        onPointerLeave={handleMouseLeave}
        onPointerMove={handleMouseMove}
        suppressContentEditableWarning
        data-level={element?.level}
        style={{
          textAlign: align,
          '--block-bg': Colors.getAdaptColor(background),
          '--block-font-color': color,
          color: 'var(--block-font-color)',
          background: nestedBlocks.includes(type) && background ? `var(--block-bg)` : undefined,
          overflow: disableOverflowTypes.includes(type) ? 'visible' : 'hidden',
          pointerEvents: isGlobalDragging ? 'none' : undefined,
          ...rest.style
        }}
        className={classNames(
          'BlockCommon',
          type === 'columnList' && styles.ColumnListBlock,
          type === 'column' && styles.ColumnBlock,
          type?.startsWith('heading') && styles.HeadingBlock,
          type !== 'column' && type !== 'columnList' && !type?.startsWith('heading') && 'ParagraphBlock'
        )}
        {...rest}
      >
        {children}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              transition={{ duration: 0.2 }}
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={'SelectedBlock'}
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
              flexShrink: 0,
              overflow: 'visible'
            },
            role: 'column'
          },
          renderChildren()
        )
      : renderChildren()
  }
)

export default Block
