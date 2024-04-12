import { Icon, Tooltip } from '@/components'
import { useGlobalIsDragging } from '@/core'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { FC, memo, MouseEventHandler, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import useReadOnlyEditor from '../hooks/useReadOnly'
import ClassName from '@/styles/classNames'
import { useAtomValue } from 'jotai'
import { EditorBlockHandleAtom } from '../hooks/useBlockHandle'
import useEventListener from '@/hooks/utils/useEventListener'
import { Colors } from '@/consts'
import { useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { EditorOverlayStateAtom } from '@/core/components/editor/components/overlay/useEditorOverlay'
import { assignProperties } from '@/utils'

type IBlockHandle = FC<{
  outerVisible: boolean
  onDragClick: MouseEventHandler
  onMenuClick: MouseEventHandler
  onAddClick: MouseEventHandler
  containerRef: RefObject<HTMLElement>
}>
const BlockHandle: IBlockHandle = ({ outerVisible, onAddClick, onDragClick, onMenuClick, containerRef }) => {
  const [innerVisible, setInnerVisible] = useState(false)
  const [globalDragging] = useGlobalIsDragging()
  const instance = useEditorInstance()
  const blockHandleState = useAtomValue(EditorBlockHandleAtom)
  const { visible, targetHeight, top, left } = blockHandleState
  const overlayStata = useAtomValue(EditorOverlayStateAtom)
  const realVisible = (outerVisible && visible) || (overlayStata.visible && overlayStata.content === 'blockDetailsMenu')
  const isReadOnly = useReadOnlyEditor()
  const { t } = useTranslation()
  const currentXY = useRef(undefined)

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
  const AddTooltip = (
    <div
      className={css({
        fontSize: '0.8rem',
        fontWeight: 600
      })}
    >
      <span style={{ color: 'white' }}>{t('editor.click')} </span>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t('editor.to add a block below')}</span>
    </div>
  )
  const DragTooltip = (
    <div
      className={css({
        fontSize: '0.8rem',
        fontWeight: 600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      })}
    >
      <div>
        <span style={{ color: 'white' }}>{t('editor.drag')} </span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t('editor.to move block')}</span>
      </div>
      <div>
        <span style={{ color: 'white' }}>{t('editor.click')} </span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{t('editor.to open menu')}</span>
      </div>
    </div>
  )
  const hasHeader = useSelectAtomValue(EditorStateAtom, s => s.layout?.showHeader) !== false
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
              top: hasHeader ? (top ?? 0) + 36 : top,
              left: left || 0 - 5,
              width: 5,
              height: targetHeight,
              zIndex: 99,
              userSelect: 'none'
            }}
          >
            {blockHandleState.showAdd && (
              <Tooltip delay={300} style={{ background: 'rgba(0,0,0,0.8)' }} position="top" content={AddTooltip}>
                <div
                  onClick={e => {
                    onAddClick?.(e)
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
                  <Icon size={18} name="park-plus" />
                </div>
              </Tooltip>
            )}
            <Tooltip
              delay={300}
              style={{
                background: 'rgba(0,0,0,0.8)',
                transform: 'translate3d(-50%, 15px ,0)'
              }}
              position="top"
              content={DragTooltip}
            >
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
                    // if (Math.abs(currentXYz.x - e.clientX) > 2 || Math.abs(currentXYz.y - e.clientY) > 2) {
                    onDragClick?.(e)
                    dragClickedRef.current = true
                    // }
                  }
                }}
                onPointerUp={e => {
                  onMenuClick?.(e)
                  menuClickedRef.current = true
                  setTimeout(() => {
                    menuClickedRef.current = false
                  }, 100)
                }}
                className={ClassName.flatButton(undefined, '3px')}
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
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
  const container = containerRef.current?.parentElement
  if (container) {
    return createPortal(renderHandle(), container)
  }
}

export default memo(BlockHandle)
