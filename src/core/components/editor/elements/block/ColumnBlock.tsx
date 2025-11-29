import React, { cloneElement, FC, memo, useEffect, useLayoutEffect, useRef } from 'react'
import { ReactEditor, RenderElementProps, useGlobalIsDragging, useSlateStatic } from '@/core'
import { useMergedRef } from '@/hooks'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { useAtomValue } from 'jotai/index'
import useBlockContentSearch from '@/core/components/editor/elements/block/useBlockContentSearch'
import useBlockDetails from '@/core/components/editor/elements/block/useBlockDetails'
import { useEditorComposing } from '@/core/components/editor/slate-react/components/editable'
import useBlockSelect from '@/core/components/editor/elements/block/useBlockSelect'
import { Editor, Range, Transforms } from 'slate'
import { useUnmount } from 'react-use'
import EditorSettings from '@/core/components/editor/consts/settings'
import { Colors } from '@/consts'
import classNames from 'classnames'
import styles from '@/core/components/editor/elements/block/index.module.less'
import BlockSelectionRenderer from '@/core/components/editor/elements/block/BlockSelectionRenderer'
import { BlockProps } from '@/core/components/editor/elements/block/index'

const ColumnBlock: FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & BlockProps & RenderElementProps> =
  memo(({ scrollElementRef, blockId, children, ratio, type, attributes, element, ...rest }) => {
    const blockRef = useRef<HTMLDivElement>(null)
    const columnRef = useRef<HTMLDivElement>(null)
    const editor = useSlateStatic()
    const mergedChildrenRef = useMergedRef(blockRef, attributes.ref)
    const [isGlobalDragging] = useGlobalIsDragging()
    const instance = useEditorInstance()
    const {
      width: blockWidth,
      isVoid
    } = useBlockDetails(element, editor)
    const { handleCollisionSelectBlock, selectBlock, isSelected, deselectBlock } = useBlockSelect({
      element,
      instance,
      blockRef,
      scrollElementRef
    })

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
      const block = blockRef.current
      if (!block) return
      const selectable = block.classList.contains('selectable') ? block : block.querySelector('.selectable')
      const blockBound = selectable?.getBoundingClientRect()
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

    useLayoutEffect(() => {
      const width = `calc(( 100% - ${
        46 * ((columnRef.current?.parentElement?.querySelectorAll("[data-type='column']").length || 2) - 1)
      }px ) * ${ratio?.toFixed(3)})`
      if (columnRef.current) {
        columnRef.current.style.width = width
      }
    }, [ratio])
    useEffect(() => {
      instance.blockOps?.setBlockFuncs(blockId, {
        selectBlock,
        collisionSelectBlock: handleCollisionSelectBlock,
        getElement: () => element,
        getIndicatorPosition,
        deselectBlock,
        getClientBound: () => blockRef.current?.getBoundingClientRect(),
        removeSelf: () => {
          const path = ReactEditor.findPath(editor, element)
          Transforms.removeNodes(editor, {
            at: path
          })
        },
        getPath: () => ReactEditor.findPath(editor, element)
      })
    })
    useUnmount(() => {
      instance.blockOps?.removeBlockFuncs(blockId)
    })
    const renderChildren = () => (
      // @ts-ignore
      <div
        key={blockId}
        {...attributes}
        ref={mergedChildrenRef}
        suppressContentEditableWarning
        contentEditable={Editor.isVoid(editor, element) ? 'false' : undefined}
        style={{
          ...rest.style,
          width: blockWidth,
          maxWidth: blockWidth,
          overflow: 'visible',
          pointerEvents: isGlobalDragging ? 'none' : undefined
        }}
        className={classNames('BlockCommon', styles.ColumnBlock)}
        {...rest}
      >
        {children}
      </div>
    )

    return cloneElement(
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
  })

export default ColumnBlock
