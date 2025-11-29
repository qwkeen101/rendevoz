import { Icon } from '@/components'
import { ReactEditor, useGlobalIsDragging } from '@/core'
import { AnimatePresence, motion } from 'framer-motion'
import { FC, memo, MouseEventHandler, RefObject, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import useReadOnlyEditor from '../hooks/useReadOnly'
import ClassName from '@/styles/classNames'
import { useAtom, useAtomValue } from 'jotai'
import { EditorBlockHandleAtom } from '../hooks/useBlockHandle'
import useEventListener from '@/hooks/utils/useEventListener'
import { Colors } from '@/consts'
import useEditorInstance from '../hooks/useEditorInstance'
import { EditorOverlayStateAtom } from '../components/overlay/useEditorOverlay'
import PageConfigContext from '@/core/components/PageConfigContext'
import { HistoryEditor } from 'slate-history'
import { Path, Transforms } from 'slate'
import rebuildDragSelect from '../utils/rebuildDragSelect'
import { normalizeEditorDragBlocksToGlobalDraggingDetails } from '../hooks/drag/useEditorDrag'
import useIsDragging from '../hooks/useIsDragging'
import { CustomEditor } from '~/typings'
import { Id } from '@/utils'
import { useClickOutside } from '@/hooks'
import useEditorPointerMove from '../hooks/useEditorPointerMove'

type IBlockHandle = FC<{
  editor: CustomEditor
  scrollElementRef: RefObject<HTMLElement>
}>
const BlockHandle: IBlockHandle = ({ scrollElementRef, editor }) => {
  const [innerVisible, setInnerVisible] = useState(false)
  const [globalDragging] = useGlobalIsDragging()
  const [isDragging, setIsDragging] = useIsDragging()
  const [blockHandleState, setBlockHandle] = useAtom(EditorBlockHandleAtom)
  const { visible, targetHeight, top, left } = blockHandleState
  const overlayStata = useAtomValue(EditorOverlayStateAtom)
  const isReadOnly = useReadOnlyEditor()
  const realVisible = (!!(!isDragging && !isReadOnly) && visible) || (overlayStata.visible && overlayStata.content === 'blockDetailsMenu')
  const { t } = useTranslation()
  const pageConfig = useContext(PageConfigContext)
  const currentXY = useRef(undefined)
  const instance = useEditorInstance()
  useEditorPointerMove(instance, editor, scrollElementRef)
  useClickOutside(() => {
    setBlockHandle(s => (s.visible === false ? s : { ...s, visible: false }))
  }, scrollElementRef)
  useLayoutEffect(() => {
    const keyDownHandler = () => {
      setBlockHandle(s => (s.visible ? { ...s, visible: false } : s))
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [])
  const handleDragClick = useCallback(
    e => {
      HistoryEditor.withoutSaving(editor, () => {
        Transforms.deselect(editor)
      })
      if (instance.values.selectedBlocks.size > 0) {
        const rebuild = rebuildDragSelect(instance, e)
        if (rebuild) {
          Global.commonOps?.setDraggingElements(rebuild)
        }
      } else {
        const dragElement = editor.currentEnterElement
        if (dragElement) {
          const dragDOM = ReactEditor.toDOMNode(editor, dragElement)
          const cloned = dragDOM.cloneNode(true)
          const rect = dragDOM.getBoundingClientRect()
          const wrapper = document.createElement('div')
          wrapper.style.width = `${rect.width}px`
          wrapper.style.height = `${rect.height}px`
          wrapper.appendChild(cloned)
          wrapper.classList.add('disable-all-pointer-events')
          Global.commonOps?.setDraggingElements(wrapper)
        }
      }
      normalizeEditorDragBlocksToGlobalDraggingDetails(instance).then(res => {
        Global.values.draggingDetails = res
        Global.commonOps?.startDrag()
      })
    },
    [setIsDragging]
  )
  const handleAddClick = () => {
    editor.currentAddClickElement = editor.currentEnterElement
    if (editor.currentAddClickElement) {
      const currentElementPath = instance.getElementPathById?.(editor.currentAddClickElement.id)
      if (currentElementPath) {
        Transforms.insertNodes(
          editor,
          {
            type: 'paragraph',
            id: Id.getId(),
            children: [{ text: '' }]
          },
          { at: Path.next(currentElementPath) }
        )
        Transforms.select(editor, Path.next(currentElementPath))
      }
    }
  }
  const handleMenuClick: MouseEventHandler = e => {
    const ele = editor.currentEnterElement
    if (ele) {
      instance.selectOps?.selectBlock(ele.id)
      editor.currentAddClickElement = ele
      setIsDragging(false)
      const rect = e.currentTarget.getBoundingClientRect()
      instance.overlayOps?.open('blockDetailsMenu', {
        x: rect.right - 16,
        y: rect.top
      })
    }
  }
  const hasMouseSelection = () => {
    return !window.getSelection()?.isCollapsed
  }
  useEventListener('pointerup', () => {
    currentXY.current = undefined
    dragClickedRef.current = false
  })
  const dragClickedRef = useRef(false)
  useLayoutEffect(() => {
    if (globalDragging) {
      setInnerVisible(false)
    }
  }, [globalDragging])
  const isInside = useRef(false)
  useEffect(() => {
    if (realVisible) {
      setInnerVisible(true)
    }
    // leave block
    if (!realVisible) {
      if (isInside.current) {
        return
      } else {
        setInnerVisible(false)
      }
    }
  }, [realVisible])

  const menuClickedRef = useRef(false)

  const renderHandle = () => {
    return (
      <AnimatePresence>
        {targetHeight && innerVisible && !hasMouseSelection() && !isReadOnly && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerEnter={() => {
              isInside.current = true
            }}
            onPointerLeave={() => {
              isInside.current = false
              if (visible === false && !menuClickedRef.current) {
                setInnerVisible(false)
              }
            }}
            style={{
              position: 'absolute',
              top,
              left: left || 0 - 5,
              width: 5,
              height: targetHeight,
              zIndex: 99,
              userSelect: 'none'
            }}
          >
            {blockHandleState.showAdd && pageConfig.editorAdd !== false && (
              <div
                onClick={() => {
                  handleAddClick()
                  setInnerVisible(false)
                }}
                className={ClassName.flatButton(undefined, '3px')}
                style={{
                  position: 'absolute',
                  left: -48,
                  width: 24,
                  height: 24,
                  cursor: 'pointer',
                  color: Colors.Font.SuperTransparent
                }}
              >
                <Icon strokeWidth={4} size={18} name="park-plus" />
              </div>
            )}
            <div
              onPointerDown={e => {
                currentXY.current = {
                  x: e.clientX,
                  y: e.clientY
                }
              }}
              onPointerMove={e => {
                const currentXYz = currentXY.current
                if (dragClickedRef.current) return
                if (currentXYz) {
                  handleDragClick?.(e)
                  dragClickedRef.current = true
                }
              }}
              onPointerUp={e => {
                handleMenuClick(e)
                menuClickedRef.current = true
                setTimeout(() => {
                  menuClickedRef.current = false
                }, 100)
              }}
              className={ClassName.flatButton(undefined, '3px')}
              role={'editor-drag-handle'}
              style={{
                position: 'absolute',
                left: -24,
                width: 24,
                height: 24,
                cursor: 'grab',
                color: Colors.Font.SuperTransparent
              }}
            >
              <Icon size={18} name="park-drag" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
  const container = scrollElementRef.current
  if (container) {
    return createPortal(renderHandle(), container)
  }
}

export default memo(BlockHandle)
