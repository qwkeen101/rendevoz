import { Provider, useAtomValue } from 'jotai/react'
import { createStore } from 'jotai/vanilla'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { FlowAtom, useFlow, useSetWhiteboardNodes, WhiteboardAtom } from './StateHooks'
import TreeNodeContainer from './node/NodeContainer'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { GlobalEventHandler } from '@/events/globalEvent'
import WhiteboardSelect from './hooks/WhiteboardSelect'
import { globalStore, ObjectStore } from '@/api/stores'
import FlowManager from './FlowManager'
import { IWhiteboard, IWhiteboardNode, IWhiteboardProps } from '~/typings/data'
import { Content } from '@/components'
import { useClickOutside, useGlobalAtomValue, useSelectAtomValue } from '@/hooks'
import WhiteboardRightbar, { WhiteboardSidebarStateAtom } from './sidebar/WhiteboardRightbar'
import { Rendevoz } from '../../rendevoz'
import { WhiteboardStateAtom } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import { useWhiteboardInstance, WhiteboardInstanceAtom } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { IWhiteboardInstance } from '~/typings'
import { assignProperties, waitFor } from '@/utils'
import WhiteboardEmptyIndicator from '@/core/components/whiteboard/WhiteboardEmptyIndicator'
import Background from '@/core/components/whiteboard/Background'
import { getSetting } from '@/core'
import FreeHandLayer from '@/core/components/whiteboard/freehand/FreeHandLayer'
import WhiteboardPanzoom from '@/core/components/whiteboard/hooks/WhiteboardPanzoom'
import WhiteboardControlBar from '@/core/components/whiteboard/toolbars/WhiteboardControlBar'
import WhiteboardPenToolsBar from '@/core/components/whiteboard/toolbars/WhiteboardPenToolsBar'
import { css } from '@emotion/css'
import WhiteboardFloatBar from '@/core/components/whiteboard/toolbars/WhiteboardFloatBar'
import WhiteboardLint from '@/core/components/whiteboard/WhiteboardLint'
import WhiteboardHeader from '@/core/components/whiteboard/WhiteboardHeader'
import { useSetAtom, useStore } from 'jotai'
import WhiteboardFloatNodesLayer from '@/core/components/whiteboard/WhiteboardFloatNodesLayer'
import WhiteboardHookContainer from '@/core/components/whiteboard/WhiteboardHookContainer'
import SnapDragLayer from '@/core/components/whiteboard/snap/SnapDragLayer'
import FakeMindmapDragLayer from '@/core/components/whiteboard/node/mindmap/FakeMindmapDragLayer'
import WhiteboardSearch from '@/core/components/whiteboard/WhiteboardSearch'
import WhiteboardPasteSelector from '@/core/components/whiteboard/WhiteboardPasteSelector'

const WhiteboardInner = memo(({ onInstanceInitialized, layout, id, readOnly }: IWhiteboardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const flow = useFlow()
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = useMemo(() => new GlobalEventHandler(), [])
  const scopedEmitter = useScopedEventEmitter()
  const nodes = useSelectAtomValue(WhiteboardAtom, s => s?.nodes)
  const instance = useWhiteboardInstance()
  const eventListeners = useRef(new Set())
  const store = useStore()
  const setWhiteboardState = useSetAtom(WhiteboardStateAtom)
  const [viewportInitialized, setViewportInitialized] = useState(false)
  const getLatestWhiteboard = () => {
    return store.get(WhiteboardAtom)
  }
  useEffect(() => {
    setWhiteboardState(s => ({
      ...s,
      readOnly,
      currentTool: readOnly ? undefined : s.currentTool,
      pointerMode: readOnly ? 'pan' : s.pointerMode,
      toolbarPointerMode: readOnly ? 'pan' : s.toolbarPointerMode
    }))
  }, [readOnly])
  assignProperties(instance, {
    getContainerNode: () => containerRef.current!,
    getOutestContainerNode: () => containerRef.current?.parentElement,
    getAllNode: () => Array.from(getLatestWhiteboard()?.nodes?.values() || []),
    eventEmitter: scopedEmitter,
    getEdge: edgeId => getLatestWhiteboard()?.edges?.get(edgeId),
    getAllEdge: () => Array.from(getLatestWhiteboard()?.edges?.values() || []),
    isFocused: () => flow.focused,
    buildNodeToEdgeIndex: () => {
      const nodeToEdgesMap = instance.values.NODE_TO_EDGE_MAP
      nodeToEdgesMap.clear()
      const edges = Array.from(getLatestWhiteboard()?.edges?.values() || [])
      edges.forEach(edge => {
        const { sourceId, targetId, id } = edge
        const ss = nodeToEdgesMap.get(sourceId)
        ss ? ss.add(id) : nodeToEdgesMap.set(sourceId, new Set([id]))
        const ts = nodeToEdgesMap.get(targetId)
        ts ? ts.add(id) : nodeToEdgesMap.set(targetId, new Set([id]))
        return () => {
          nodeToEdgesMap.get(sourceId)?.delete(id)
          nodeToEdgesMap.get(targetId)?.delete(id)
        }
      })
    },
    addEventListener: l => {
      eventListeners.current.add(l)
    },
    emit: e => {
      eventListeners.current.forEach(l => l(e))
    },
    removeEventListener: l => {
      eventListeners.current.delete(l)
    }
  })
  useEffect(() => {
    waitFor(
      () => !!instance.nodeOps,
      () => {
        onInstanceInitialized?.(instance)
      }
    )
  }, [])

  useEffect(() => {
    if (flow && containerRef.current) {
      emitter.addListener('global', handler)
      flow.containerEle = containerRef.current
      flow.parentContainerEle = flow.containerEle.parentElement as HTMLElement
      containerRef.current?.style.setProperty('--zoom-level', '1')
      return () => {
        emitter.removeListener('global', handler)
      }
    }
  }, [])

  useEffect(() => {
    const noZNodes: IWhiteboardNode[] = []
    if (nodes?.size) {
      Array.from(nodes.values()).forEach(n => {
        if (n.z === undefined) {
          noZNodes.push(n)
        }
      })
      if (noZNodes.length) {
        instance.updateWhiteboard?.(w => {
          noZNodes.forEach((n, index) => {
            w.nodes?.set(n.id, { ...n, z: index })
          })
        })
      }
    }
  }, [nodes])
  const setNodes = useSetWhiteboardNodes()
  flow.setNodes = setNodes

  const rightBarState = useAtomValue(WhiteboardSidebarStateAtom)

  useClickOutside(
    e => {
      flow.focused = false
    },
    {
      current: flow.parentContainerEle
    }
  )
  console.log('rerender')
  return (
    <>
      <WhiteboardPanzoom onInitialized={() => setViewportInitialized(true)} />
      {viewportInitialized && <WhiteboardHookContainer whiteboardId={id} />}
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
        onPointerDown={e => {
          if (e.target === e.currentTarget) {
            instance.selectOps?.deselectAll()
          }
        }}
        onPointerUpCapture={e => {
          const isPanning = store.get(WhiteboardStateAtom).isPanning
          if (!isPanning && e.button === 2 && e.target === e.currentTarget) {
            const coord = instance.coordOps?.transformWindowPositionToPosition({ x: e.clientX, y: e.clientY })
            if (coord) {
              instance.toolbarOps?.openContextMenuToolbar({
                x: coord.x,
                y: coord.y
              })
            }
          }
        }}
        onContextMenu={e => {
          if (e.target === e.currentTarget) {
            const coord = instance.coordOps?.transformWindowPositionToPosition({ x: e.clientX, y: e.clientY })
            if (coord) {
              instance.toolbarOps?.openContextMenuToolbar({
                x: coord.x,
                y: coord.y
              })
            }
          }
        }}
        onPointerDownCapture={() => {
          flow.focused = true
        }}
        onFocus={() => {
          flow.focused = true
        }}
        style={{
          touchAction: 'none',
          overflow: 'clip',
          transition: 'width 0.26s ease',
          width: rightBarState.visible ? `calc(100% - ${rightBarState.width})` : undefined
        }}
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
          {viewportInitialized && <TreeNodeContainer />}
          {!readOnly && (
            <>
              <WhiteboardSelect containerRef={containerRef} />
              <SnapDragLayer />
              <FreeHandLayer />
            </>
          )}
        </div>
        <WhiteboardEmptyIndicator />
        <Background />
        <WhiteboardFloatBar />
        <WhiteboardLint />
        {layout?.showPencilToolbar !== false && !readOnly && layout?.showLeftToolbar !== false && <WhiteboardPenToolsBar />}
        {layout?.showControlBar !== false && <WhiteboardControlBar />}
      </Content>
      <WhiteboardHeader />
      <WhiteboardFloatNodesLayer />
      <WhiteboardRightbar />
      <WhiteboardSearch />
      <WhiteboardPasteSelector />
      <FakeMindmapDragLayer />
    </>
  )
})

export const Whiteboard = memo(
  ({
    whiteboardId,
    onTabTitleChange,
    readOnly,
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
      const instance: IWhiteboardInstance = {
        values: {
          id: whiteboardId,
          copiedElements: [],
          ID_TO_NODE_MAP: new Map(),
          ID_TO_EDGE_MAP: new Map(),
          NODE_TO_EDGE_MAP: new Map(),
          transformHistory: {
            undos: [],
            redos: []
          }
        }
      }
      const flowManager = new FlowManager(instance)
      flowManager.whiteboardId = whiteboardId
      store.set(FlowAtom, flowManager)

      store.set(WhiteboardInstanceAtom, instance)

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
    if (!whiteboard) return null
    return (
      <Provider store={store}>
        {whiteboardId && (
          <WhiteboardInner onInstanceInitialized={onInstanceInitialized} id={whiteboardId} layout={layout} readOnly={readOnly} />
        )}
      </Provider>
    )
  }
)
