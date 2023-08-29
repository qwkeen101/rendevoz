import { Provider, useAtomValue } from 'jotai/react'
import { createStore } from 'jotai/vanilla'
import createPanZoom, { PanZoom } from 'panzoom'
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import TreeEdgeContainer from './EdgeContainer'
import { FlowAtom, useFlow, WhiteboardAtom } from './hooks'
import TreeNodeContainer from './NodeContainer'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { GlobalEventHandler } from '@/events/globalEvent'
import useWhiteboardSelect from './useWhiteboardSelect'
import useWhiteboardAutoPan from './useWhiteboardAutoPan'
import WhiteboardSetting from './WhiteboardSetting'
import useWhiteboardDrop from './useWhiteboardDrop'
import { globalStore, MetaStore, ObjectStore } from '@/stores'
import FlowManager from './FlowManager'
import { IWhiteboard } from '~/typings/data'
import WhiteboardMiniMap from './minimap/WhiteboardMinimap'
import { Content } from '@/components'
import { useSetting } from '../setting'
import { useDebounceFn, useGlobalAtomValue } from '@/hooks'
import useWhiteboardSidebar from './useWhiteboardSidebar'
import { Rendevoz } from '../rendevoz'
import useSnapDrag from '@/core/whiteboard/hooks/useSnapDrag'
import WhiteboardBottomBar from '@/core/whiteboard/WhiteboardBottomBar'
import { useSetAtom } from 'jotai'
import { WhiteboardStateAtom } from '@/core/whiteboard/hooks/useWhiteboardState'
import { useWhiteboardInstance, WhiteboardInstanceAtom } from '@/core/whiteboard/hooks/useWhiteboardInstance'
import { IWhiteboardInstance } from '~/typings'
import { waitFor } from '@/utils'
import WhiteboardSettings from '@/core/whiteboard/WhiteboardSettings'
import useWhiteboardHistory from '@/core/whiteboard/hooks/useWhiteboardHistory'
import WhiteboardEmptyIndicator from '@/core/whiteboard/WhiteboardEmptyIndicator'
import { WhiteboardTransformAtom } from '@/core/whiteboard/hooks/useWhiteboardTransform'
import Background from '@/core/whiteboard/Background'
import { Colors } from '@/consts'
import { getSetting } from '@/core'
import { Excalidraw } from '@excalidraw/excalidraw'
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'

const WhiteboardInner = memo(
  ({
    id,
    enableMiniMap = true,
    onInstanceInitialized
  }: {
    id: number
    enableMiniMap?: boolean
    onInstanceInitialized?: (i: IWhiteboardInstance) => void
  }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const flow = useFlow()
    const panzoomRef = useRef<PanZoom>()
    const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
    const handler = useMemo(() => new GlobalEventHandler(), [])
    const scopedEmitter = useScopedEventEmitter()
    const whiteboard = useAtomValue(WhiteboardAtom)
    const { addTab, render } = useWhiteboardSidebar()
    const [setting] = useSetting()
    const { renderSnapLayer } = useSnapDrag()
    useWhiteboardHistory()
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
        const excalidraw = excalidrawRef.current
        const panzoom = createPanZoom(containerRef.current, {
          smoothScroll: false,
          maxZoom: 5,
          minZoom: 0.0625,
          zoomDoubleClickSpeed: 1,
          beforeMouseDown: e => {
            if (flow.selectable) return true
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
            if (e.defaultPrevented) {
              return true
            } else {
              return false
            }
          },
          disableKeyboardInteraction: true
        })
        panzoomRef.current = panzoom
        panzoom.on('pan', e => {
          scopedEmitter.emit('whiteboard', {
            type: 'panChange'
          })
          const t = panzoom.getTransform()
          if (excalidrawRef.current) {
            const { x, y, scale } = t
            const ex = excalidrawRef.current
            console.log(ex.getAppState())
            const exScroll = {
              x: x / scale,
              y: y / scale
            }
            ex.updateScene({
              elements: ex.getSceneElements(),
              appState: { ...ex.getAppState(), scrollY: exScroll.y, scrollX: exScroll.x, zoom: { value: scale } }
            })
          }
          // excalidrawRef.current?.updateScene({
          //   appState: {
          //     scrollY: t.y,
          //     scrollX: t.x,
          //     zoom: t.scale
          //   }
          // })
          setWhiteboardTransform([t.x, t.y, t.scale])
        })
        panzoom.on('zoom', e => {
          const { scale, x, y } = panzoom.getTransform()
          setWhiteboardTransform([x, y, scale])
          if (excalidrawRef.current) {
            const ex = excalidrawRef.current
            console.log(ex.getAppState())
            const exScroll = {
              x: x / scale,
              y: y / scale
            }
            ex.updateScene({
              elements: ex.getSceneElements(),
              appState: { ...ex.getAppState(), scrollY: exScroll.y, scrollX: exScroll.x, zoom: { value: scale } }
            })
          }

          console.log(scale)
          flow.containerTransformScale = scale
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
    flow.onNodeFocus = node => {
      switch (node.type) {
        case 'metaObject':
          {
            const { metaObjectId } = node
            if (metaObjectId) {
              MetaStore.getMetaObjectById(metaObjectId).then(async meta => {
                if (meta) {
                  if (meta.objectId) {
                    const target = await ObjectStore(meta.type).getOneById(meta.objectId)
                    if (target) {
                      switch (target.specType) {
                        case 'pdf':
                        case 'image':
                        case 'webpage':
                        case 'note':
                        case 'video':
                          addTab(target.specType, meta.objectId)
                      }
                    }
                  }
                }
              })
            }
          }
          break
        case 'note':
          addTab('note', node.noteId)
      }
    }
    const { renderSelect } = useWhiteboardSelect(containerRef)
    useWhiteboardAutoPan()
    useWhiteboardDrop()
    const excalidrawRef = useRef<ExcalidrawImperativeAPI>(null)
    return (
      <Content fullHeight fullWidth role="data-container" tabIndex={undefined}>
        {/*<div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>*/}
        {/*  <Excalidraw*/}
        {/*    ref={r =>*/}
        {/*      r?.readyPromise?.then(v => {*/}
        {/*        excalidrawRef.current = v*/}
        {/*      })*/}
        {/*    }*/}
        {/*    onChange={(elements, appState, files) => {*/}
        {/*      console.log(appState)*/}
        {/*      const { scrollX, scrollY, zoom } = appState*/}
        {/*      if (appState.zoom.value && panzoomRef.current) {*/}
        {/*        const realTransform = {*/}
        {/*          x: scrollX * zoom.value,*/}
        {/*          y: scrollY * zoom.value*/}
        {/*        }*/}
        {/*        const currentTransform = panzoomRef.current?.getTransform()*/}
        {/*        if (!currentTransform) return*/}
        {/*        if (currentTransform.x === realTransform.x && currentTransform.y === realTransform.y) return*/}
        {/*        setWhiteboardTransform([realTransform.x, realTransform.y, zoom.value])*/}
        {/*        setWhiteboardState(s => ({ ...s, zoom: zoom.value }))*/}
        {/*        const zoomMultipler = Math.sqrt(1 / zoom.value)*/}
        {/*        debounceSetZoom.run(zoomMultipler)*/}
        {/*        panzoomRef.current?.moveTo(realTransform.x, realTransform.y)*/}
        {/*      }*/}
        {/*    }}*/}
        {/*    initialData={{*/}
        {/*      appState: {*/}
        {/*        showWelcomeScreen: false,*/}
        {/*        openSidebar: null,*/}
        {/*        showStats: false,*/}
        {/*        viewBackgroundColor: 'transparent'*/}
        {/*      }*/}
        {/*    }}*/}
        {/*  />*/}
        {/*</div>*/}
        <div
          ref={containerRef}
          role="data-container"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: 'transparent'
          }}
        >
          <TreeEdgeContainer />
          <TreeNodeContainer />
          {renderSelect()}
          {renderSnapLayer()}
          <WhiteboardEmptyIndicator />
        </div>
        <Background />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0 }}>{render()}</div>
        <WhiteboardBottomBar />
        <WhiteboardSettings />
        {enableMiniMap && setting.whiteboard.enableMinimap && (
          <div
            style={{
              position: 'absolute',
              right: 15,
              bottom: 15,
              borderRadius: 6,
              overflow: 'hidden',
              border: `1px solid ${Colors.Background.Border}`
            }}
          >
            <WhiteboardMiniMap />
          </div>
        )}
      </Content>
    )
  }
)

export const Whiteboard = memo(
  ({
    whiteboardId,
    onTabTitleChange,
    enableMiniMap,
    onInstanceInitialized
  }: {
    whiteboardId: number
    onInstanceInitialized?: (i: IWhiteboardInstance) => void
    onTabTitleChange?: (s?: string) => void
    enableMiniMap?: boolean
  }) => {
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
        {whiteboardId && <WhiteboardInner onInstanceInitialized={onInstanceInitialized} id={whiteboardId} enableMiniMap={enableMiniMap} />}
      </Provider>
    )
  }
)
