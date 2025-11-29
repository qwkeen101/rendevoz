import { atom } from 'jotai/index'
import { XYPosition } from '~/typings'
import { Rnd } from 'react-rnd'
import { ReactNode, useEffect, useRef } from 'react'
import { getPanelPosition } from '@/core/global/utils'
import { createPortal } from 'react-dom'
import { Zindexes } from '@/consts'
import { ResizeAndDrag, WithBorder } from '@/components'
import { useAtom } from 'jotai'

const PanelStateAtom = atom<{
  draggable: boolean
  currentPosition?: XYPosition
  size?: {
    width: number
    height: number
  }
  visible: boolean
}>({
  draggable: true,
  visible: false
})

const PanelDefaultSize = {
  x: window.innerWidth / 2 - 200,
  y: window.innerHeight / 2 - 200,
  width: 320,
  height: 300
}

export default (opts?: {
  pinned?: boolean
  size?: {
    width?: number
    height?: number
  }
}) => {
  const defaultSize = opts?.size
  const [panelState, setPanelState] = useAtom(PanelStateAtom)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<Rnd>(null)
  const handlePosChange = (opts: { e?: PointerEvent; pos?: XYPosition }) => {
    if (panelState.visible === false) {
      const pos = getPanelPosition({
        e: opts.e,
        pos: opts.pos,
        defaultSize: panelState.size || {
          ...PanelDefaultSize,
          width: defaultSize?.width ?? PanelDefaultSize.width,
          height: defaultSize?.height ?? PanelDefaultSize.height
        }
      })
      if (pos) {
        setPanelState(s => ({ ...s, currentPosition: pos }))
      }
    }
  }
  const renderFloated = (children: ReactNode) => {
    if (!panelState.visible) return null
    return createPortal(
      <ResizeAndDrag
        role="global-translate-panel"
        ref={resizeRef}
        default={{
          ...PanelDefaultSize,
          width: defaultSize?.width ?? PanelDefaultSize.width,
          height: defaultSize?.height ?? PanelDefaultSize.height
        }}
        style={{
          borderRadius: 12,
          display: panelState.visible ? undefined : undefined,
          zIndex: Zindexes.GeneralPanel
        }}
        position={panelState.currentPosition}
        size={panelState.size}
        onResizeStop={(e, dir, ele, delta, pos) => {
          const bounding = ele.getBoundingClientRect()
          setPanelState(s => ({
            ...s,
            size: {
              width: bounding.width,
              height: bounding.height
            },
            currentPosition: pos
          }))
        }}
        onDragStop={(e, data) => {
          setPanelState(s => ({
            ...s,
            currentPosition: {
              x: data.x,
              y: data.y
            }
          }))
        }}
        dragHandleClassName="drag-handle"
      >
        <WithBorder borderRadius={12} ref={containerRef} className={'w-full h-full flex flex-col'}>
          {children}
        </WithBorder>
      </ResizeAndDrag>,
      document.body
    )
  }
  useEffect(() => {
    if (panelState.visible) {
      const h = (e: MouseEvent) => {
        const ele = resizeRef.current?.getSelfElement?.()
        if (ele) {
          if (e.target instanceof Element && !ele.contains(e.target)) {
            if (!opts?.pinned) {
              setPanelState(s => ({ ...s, visible: false }))
            }
          }
        }
      }
      document.addEventListener('pointerdown', h)
      return () => {
        document.removeEventListener('pointerdown', h)
      }
    }
  }, [panelState.visible, opts?.pinned])
  return {
    setVisible: (v: boolean) => setPanelState(s => ({ ...s, visible: v })),
    renderFloated,
    handlePosChange,
    panelState
  }
}
