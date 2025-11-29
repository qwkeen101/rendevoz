import useGroupState from '@/core/components/group/hooks/useGroupState'
import { Resizable } from 're-resizable'
import { memo, useEffect, useRef } from 'react'
import { Colors, KEY } from '@/consts'
import { Icon } from '@/components'
import { useMemoizedFn } from '@/hooks'
import isHotkey from 'is-hotkey'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import SidebarObjectViewer from '@/core/components/SidebarObjectViewer'

export default memo(() => {
  const [groupState, setGroupState] = useGroupState()

  useEffect(() => {
    if (groupState.sidebarVisible) {
      const groupContainer = instance.getOuterContainer?.()
      const renderContainer = rendererRef.current
      if (groupContainer && renderContainer) {
        const keydownHandler = (e: KeyboardEvent) => {
          if (isHotkey(KEY.Escape, e)) {
            setTimeout(() => {
              if (!e.defaultPrevented) {
                setGroupState(s => ({ ...s, sidebarVisible: false }))
              }
            })
          }
        }
        const clickHandler = (e: MouseEvent) => {
          if (
            document.querySelector('[role="click-cover"]') ||
            document.querySelector('[role="popup-wrapper"]') ||
            document.querySelector('[role="modal-container]"') ||
            e.target.closest('[role="click-cover"]')
          )
            return
          if (renderContainer.contains(e.target)) return
          if (groupContainer.contains(e.target)) {
            if (
              !e.target.closest(
                '[role="group-render-content"],[role="group-item-content"],[role="group-drag-handle"],[role="reorder-view"],input,textarea,[contenteditable="true"]'
              )
            ) {
              setGroupState(s => ({ ...s, sidebarVisible: false }))
            }
          }
        }
        document.addEventListener('keydown', keydownHandler)
        document.addEventListener('click', clickHandler, true)
        return () => {
          document.removeEventListener('click', clickHandler, true)
          document.removeEventListener('keydown', keydownHandler)
        }
      }
    }
  }, [groupState.sidebarVisible])

  const sidebarState = groupState.sidebarState
  const instance = useGroupInstance()
  const handleNavigateLeft = () => {
    if (sidebarState?.type === 'preview' && sidebarState.rowId) {
      const prev = instance.valueOps?.getPrevMeta(sidebarState.rowId)
      prev &&
        instance.sidebarOps?.open({
          metaId: prev.metaId,
          rowId: prev.rowId,
          type: 'preview'
        })
    }
  }
  const handleNavigateRight = () => {
    if (sidebarState?.type === 'preview' && sidebarState.rowId) {
      const next = instance.valueOps?.getNextMeta(sidebarState.rowId)
      next &&
        instance.sidebarOps?.open({
          metaId: next.metaId,
          rowId: next.rowId,
          type: 'preview'
        })
    }
  }
  const rendererRef = useRef<HTMLDivElement>(null)
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (e.defaultPrevented) return
    if (!instance.values.isFocused) return
    if (e.target instanceof Element && e.target.closest('input, textarea, [contenteditable="true"]')) return
    if (isHotkey(KEY.ArrowLeft, e)) {
      handleNavigateLeft()
      e.preventDefault()
    }
    if (isHotkey(KEY.ArrowRight, e)) {
      handleNavigateRight()
      e.preventDefault()
    }
  })
  useEffect(() => {
    if (groupState.sidebarVisible && sidebarState?.type === 'preview') {
      document.addEventListener('keydown', keydownHandler)
      return () => {
        document.removeEventListener('keydown', keydownHandler)
      }
    }
  }, [groupState.sidebarVisible, sidebarState?.type])
  const renderer = () => {
    if (groupState.sidebarVisible) {
      if (groupState.sidebarState?.type === 'preview') {
        const id = groupState.sidebarState.metaId
        if (id) {
          return (
            <SidebarObjectViewer
              id={id}
              key={id}
              pageConfig={{
                defaultOpenSidebar: false,
                editorHeader: true,
                pdfHeader: true,
                editorAdd: false,
                whiteboardHeader: true
              }}
            />
          )
        }
      }
    }
  }
  return (
    <Resizable
      defaultSize={{
        width: Math.min(Math.max(window.innerWidth * 0.5, 300), 600),
        height: '100%'
      }}
      style={{
        position: 'absolute',
        zIndex: 50,
        background: Colors.Background.Global,
        right: 0,
        boxShadow: Colors.Background.BoxShadow,
        opacity: groupState.sidebarVisible ? 1 : 0,
        top: 0,
        pointerEvents: groupState.sidebarVisible ? 'auto' : 'none',
        transform: groupState.sidebarVisible ? undefined : 'translateX(100%)'
      }}
      enable={{ left: true }}
      role={'group-side-peek'}
    >
      <Icon
        name={'park-double-right'}
        className={'square-button'}
        size={18}
        onClick={() => {
          setGroupState(s => ({ ...s, sidebarVisible: false }))
        }}
        style={{
          background: Colors.Background.Popover,
          position: 'absolute',
          left: -36,
          color: Colors.Font.Transparent,
          top: '24px',
          boxShadow: Colors.Background.BorderBoxShadow,
          transform: 'translateY(-50%)'
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          padding: groupState.sidebarState?.type === 'labels' ? 12 : 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center'
        }}
        ref={rendererRef}
      >
        {renderer()}
      </div>
    </Resizable>
  )
})
