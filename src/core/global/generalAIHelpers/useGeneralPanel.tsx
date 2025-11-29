import { atom } from 'jotai/index'
import { XYPosition } from '~/typings'
import { Rnd } from 'react-rnd'
import { memo } from 'react'
import { GlobalInstance, useGlobalAtom, useShortcut } from '@/hooks'
import { assignProperties } from '@/utils'
import { getPanelPosition } from '@/core/global/utils'
import Id from '@/utils/id'
import { AIService } from '@/api/services'
import { createPortal } from 'react-dom'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { Zindexes } from '@/consts'
import { ResizeAndDrag, WithBorder } from '@/components'
import TranslatePanel from '@/core/global/generalAIHelpers/TranslatePanel'
import ExplainPanel from '@/core/global/generalAIHelpers/ExplainPanel'
import ChatPanel from '@/core/global/generalAIHelpers/ChatPanel'
import { panels } from '@uiw/react-codemirror'

const PanelStateAtom = atom<{
  draggable: boolean
  currentPosition?: XYPosition
  size?: {
    width: number
    height: number
  }
  ref?: Rnd
  visible: boolean
  active?: 'translate' | 'chat' | 'explain'
}>({
  draggable: true,
  visible: false,
  active: 'chat'
})

const PanelDefaultSize = {
  x: window.innerWidth / 2 - 200,
  y: window.innerHeight / 2 - 200,
  width: 380,
  height: 400
}

export default memo(() => {
  const floated = KeyvalueStore.useValue('aiFloated') ?? true
  const [panelState, setPanelState] = useGlobalAtom(PanelStateAtom)

  assignProperties(GlobalInstance, {
    commonOps: {
      ...GlobalInstance.commonOps,
      toggleExplainer: v => {
        setPanelState(s => ({ ...s, visible: v, active: 'explain' }))
      },
      toggleTranslator: v => {
        setPanelState(s => ({ ...s, visible: v, active: 'translate' }))
      },
      toggleChat: v => {
        setPanelState(s => ({ ...s, visible: v, active: 'chat' }))
      }
    }
  })
  const handlePosChange = (opts: { e?: PointerEvent; pos?: XYPosition }) => {
    if (panelState.visible === false) {
      const pos = getPanelPosition({
        e: opts.e,
        pos: opts.pos,
        defaultSize: panelState.size || PanelDefaultSize
      })
      if (pos) {
        setPanelState(s => ({ ...s, currentPosition: pos }))
      }
    }
  }
  useShortcut('openTranslatePanel', () => {})
  const renderContent = () => {
    const active = panelState.active
    return (
      <>
        <TranslatePanel onPositionChange={handlePosChange} active={active === 'translate'} />
        <ExplainPanel onPositionChange={handlePosChange} active={active === 'explain'} />
        <ChatPanel active={active === 'chat'} />
      </>
    )
  }
  if (floated) {
    return createPortal(
      <ResizeAndDrag
        role="global-translate-panel"
        ref={r => {
          r && !panelState.ref && setPanelState(s => ({ ...s, ref: r }))
        }}
        default={PanelDefaultSize}
        style={{
          borderRadius: 8,
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
        <WithBorder className={'w-full h-full flex flex-col'}>{renderContent()}</WithBorder>
      </ResizeAndDrag>,
      document.body
    )
  }
})
