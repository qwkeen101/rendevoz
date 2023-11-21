import { Provider, useAtomValue } from 'jotai/react'
import { createStore } from 'jotai/vanilla'
import { createPanZoom } from './panzoom'
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import TreeEdgeContainer from './EdgeContainer'
import { FlowAtom, useFlow, useSetWhiteboardNodes, WhiteboardAtom } from './hooks'
import TreeNodeContainer from './NodeContainer'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { GlobalEventHandler } from '@/events/globalEvent'
import useWhiteboardSelect from './useWhiteboardSelect'
import useWhiteboardAutoPan from './useWhiteboardAutoPan'
import useWhiteboardDrop from './hooks/drop/useWhiteboardDrop'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import FlowManager from './FlowManager'
import { IWhiteboard, IWhiteboardProps } from '~/typings/data'
import { Content } from '@/components'
import { useCapturePreviewImage, useDebounceFn, useGlobalAtomValue } from '@/hooks'
import useWhiteboardSidebar from './useWhiteboardSidebar'
import { Rendevoz } from '../../rendevoz'
import useSnapDrag from '@/core/components/whiteboard/hooks/useSnapDrag'
import { useSetAtom } from 'jotai'
import { WhiteboardStateAtom } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import {
  useAssignWhiteboardInstance,
  useWhiteboardInstance,
  WhiteboardInstanceAtom
} from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { IWhiteboardInstance } from '~/typings'
import { waitFor } from '@/utils'
import WhiteboardSettings from '@/core/components/whiteboard/WhiteboardSettings'
import useWhiteboardHistory from '@/core/components/whiteboard/hooks/useWhiteboardHistory'
import WhiteboardEmptyIndicator from '@/core/components/whiteboard/WhiteboardEmptyIndicator'
import { WhiteboardTransformAtom } from '@/core/components/whiteboard/hooks/useWhiteboardTransform'
import Background from '@/core/components/whiteboard/Background'
import { getSetting } from '@/core'
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import useFreeHand from '@/core/components/whiteboard/freehand/useFreeHand'
import useWhiteboardErase from '@/core/components/whiteboard/hooks/useWhiteboardErase'
import useWhiteboardPanzoom from '@/core/components/whiteboard/hooks/useWhiteboardPanzoom'
import WhiteboardControlBar from '@/core/components/whiteboard/toolbars/WhiteboardControlBar'
import WhiteboardNodesBar from '@/core/components/whiteboard/toolbars/WhiteboardNodesBar'
import WhiteboardPenToolsBar from '@/core/components/whiteboard/toolbars/WhiteboardPenToolsBar'
import useWhiteboardShortcut from '@/core/components/whiteboard/hooks/useWhiteboardShortcut'
import { css } from '@emotion/css'

const WhiteboardInner = memo(({ id, onInstanceInitialized, layout, enableMiniMap }: IWhiteboardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const flow = useFlow()
  const panzoomRef = useRef<PanZoom>()
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = useMemo(() => new GlobalEventHandler(), [])
  const scopedEmitter = useScopedEventEmitter()
  const whiteboard = useAtomValue(WhiteboardAtom)
  const { render } = useWhiteboardSidebar()
  const { renderSnapLayer } = useSnapDrag()
  useWhiteboardShortcut()
  useWhiteboardHistory()
  useAssignWhiteboardInstance()
  const setWhiteboardTransform = useSetAtom(WhiteboardTransformAtom)
  const instance = useWhiteboardInstance()
  useEffect(() => {
    waitFor(
      () => !!instance.openTabInSidebar,
      () => {
        onInstanceInitialized?.(instance)
      }
    )
  }, [])
  const setWhiteboardState = useSetAtom(WhiteboardStateAtom)
  const debounceSetZoom = useDebounceFn(
    (zoom: number) => {
      containerRef.current?.style.setProperty('--zoom-level', String(zoom))
    },
    { wait: 200 }
  )
  useLayoutEffect(() => {
    if (flow && containerRef.current) {
      emitter.addListener('global', handler)
      flow.containerEle = containerRef.current
      flow.parentContainerEle = flow.containerEle.parentElement as HTMLElement
      containerRef.current?.style.setProperty('--zoom-level', '1')
      const panzoom = createPanZoom(containerRef.current, {
        smoothScroll: false,
        maxZoom: 5,
        minZoom: 0.05,
        filterKey: () => {
          return true
        },
        onTouch: e => {
          e.preventDefault()
          return false
        },
        zoomDoubleClickSpeed: 1,
        beforeMouseDown: e => {
          const pointerMode = flow.parentContainerEle?.getAttribute('data-pointer-mode')
          if (pointerMode === 'pan') {
            return false
          }
          if (e.button === 1) {
            return false
          }
          if (!(e.target as HTMLElement).hasAttribute('role')) return true
          if ((e.target as HTMLElement).hasAttribute('role')) {
            const role = (e.target as HTMLElement).getAttribute('role')
            if (role === 'modal' || role === 'data-container') return false
            return true
          }
          if (e.defaultPrevented) {
            return true
          } else {
            return false
          }
        },
        beforeWheel: e => {
          const pointerMode = flow.parentContainerEle?.getAttribute('data-pointer-mode')
          if (e.defaultPrevented) {
            return true
          }
          if (pointerMode === 'pan') {
            return false
          }

          if (e.ctrlKey || e.metaKey) {
            return false
          }
          const curr = panzoom.getTransform()
          if (e.deltaX !== 0 && e.deltaY !== 0) {
            panzoom.moveTo(curr.x - e.deltaX, curr.y - e.deltaY)
            return true
          }
          if (e.shiftKey) {
            panzoom.moveTo(curr.x - (e.deltaY || e.deltaX), curr.y)
          } else {
            panzoom.moveTo(curr.x, curr.y - e.deltaY)
          }
          return true
        },
        disableKeyboardInteraction: true
      })
      panzoomRef.current = panzoom
      panzoom.on('pan', e => {
        scopedEmitter.emit('whiteboard', {
          type: 'panChange'
        })
        const t = panzoom.getTransform()
        setWhiteboardTransform([t.x, t.y, t.scale])
      })
      panzoom.on('zoom', e => {
        const { scale, x, y } = panzoom.getTransform()
        flow.containerTransformScale = scale
        setWhiteboardTransform([x, y, scale])
        const zoomMultipler = Math.sqrt(1 / scale)
        scopedEmitter.emit('whiteboard', {
          type: 'zoomChange',
          data: {
            zoomLevel: scale,
            zoomMultiplier: zoomMultipler
          }
        })
        setWhiteboardState(s => ({ ...s, zoom: scale }))
        debounceSetZoom.run(zoomMultipler)
      })
      flow.panzoom = panzoom
      return () => {
        const transform = panzoom.getTransform()
        flow.dispose()
        ObjectStore('whiteboard').updateOne(
          {
            id,
            lastViewport: transform
          },
          { silent: true }
        )
        panzoom.dispose()
        emitter.removeListener('global', handler)
      }
    }
  }, [])
  useEffect(() => {
    if (whiteboard?.lastViewport) {
      const lastViewport = whiteboard.lastViewport
      const panzoom = panzoomRef.current
      setWhiteboardTransform([lastViewport.x, lastViewport.y, lastViewport.scale])
      panzoom?.zoomTo(0, 0, lastViewport.scale)
      panzoom?.moveTo(lastViewport.x, lastViewport.y)
    } else {
      setWhiteboardTransform([0, 0, 1])
    }
  }, [whiteboard?.lastViewport])
  flow.onNodeFocus = async node => {
    switch (node.type) {
      case 'metaObject': {
        if (node.metaObjectId) {
          const obj = await MetaStore.getMetaObjectById(node.metaObjectId)
          if (obj?.objectId) {
            instance.openTabInSidebar?.(obj.type, obj.objectId)
          }
        }

        break
      }
    }
  }
  const setNodes = useSetWhiteboardNodes()
  flow.setNodes = setNodes
  const { renderSelect } = useWhiteboardSelect(containerRef)
  useWhiteboardAutoPan()
  useWhiteboardDrop()
  useWhiteboardErase()
  const { renderFreehands, renderDrawLayer } = useFreeHand()
  const { containerCursor } = useWhiteboardPanzoom()

  return (
    <Content
      fullHeight
      fullWidth
      role="data-container"
      ref={node => {
        if (node) {
          flow.parentContainerEle = node
        }
      }}
      className={css({
        '*': {
          touchAction: 'none'
        }
      })}
      tabIndex={0}
      onClick={() => {
        flow.focused = true
      }}
      onBlur={() => {
        flow.focused = false
      }}
      style={{ cursor: containerCursor, touchAction: 'none' }}
    >
      <div
        ref={containerRef}
        role="data-container"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          zIndex: 1,
          background: 'transparent',
          pointerEvents: 'none'
        }}
      >
        <TreeEdgeContainer />
        <TreeNodeContainer />
        {renderSelect()}
        {renderSnapLayer()}
        {renderFreehands()}
        <WhiteboardEmptyIndicator />
      </div>
      {renderDrawLayer()}
      <Background />

      {layout?.showObjectSidebar !== false && (
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 15 }}>{render()}</div>
      )}
      {layout?.showLeftToolbar !== false && <WhiteboardNodesBar />}
      {layout?.showSetting !== false && <WhiteboardSettings />}
      {layout?.showPencilToolbar !== false && layout?.showLeftToolbar !== false && <WhiteboardPenToolsBar />}
      {layout?.showControlBar !== false && <WhiteboardControlBar />}
    </Content>
  )
})

export const Whiteboard = memo(
  ({
    whiteboardId,
    onTabTitleChange,
    enableMiniMap,
    onInstanceInitialized,
    layout
  }: {
    whiteboardId: number
    onInstanceInitialized?: (i: IWhiteboardInstance) => void
    onTabTitleChange?: (s?: string) => void
  } & Omit<IWhiteboardProps, 'id'>) => {
    const previousWhiteboard = useRef<IWhiteboard>()
    const whiteboardAtom = ObjectStore('whiteboard').createAtom(whiteboardId)
    const whiteboard = useGlobalAtomValue(whiteboardAtom)
    const store = useMemo(() => {
      const store = createStore()
      const whiteboard = globalStore.get(whiteboardAtom)
      if (!whiteboard?.lineType) {
        const setting = getSetting()
        setTimeout(() => {
          ObjectStore('whiteboard').updateOne({
            id: whiteboardId,
            lineType: setting.whiteboard.defaultLineType || 'curve',
            backgroundType: setting.whiteboard.defaultBackgroundType || 'dot'
          })
        }, 10)
      }
      previousWhiteboard.current = whiteboard
      store.set(WhiteboardAtom, whiteboard)
      const flowManager = new FlowManager()
      flowManager.whiteboardId = whiteboardId
      store.set(FlowAtom, flowManager)
      store.set(WhiteboardInstanceAtom, {})
      onTabTitleChange?.(whiteboard?.name)
      return store
    }, [whiteboard?.id])
    useEffect(() => {
      const unsub = globalStore.sub(whiteboardAtom, () => {
        const whiteboard = globalStore.get(whiteboardAtom)
        const prev = previousWhiteboard.current

        previousWhiteboard.current = whiteboard
        if (prev && prev !== whiteboard) {
          store.set(WhiteboardAtom, whiteboard)
          if (prev.name !== whiteboard?.name) {
            onTabTitleChange?.(whiteboard?.name)
          }
        }
      })
      return unsub
    }, [whiteboard?.id])
    return (
      <Provider store={store}>
        {whiteboardId && (
          <WhiteboardInner onInstanceInitialized={onInstanceInitialized} id={whiteboardId} layout={layout} enableMiniMap={enableMiniMap} />
        )}
      </Provider>
    )
  }
)
