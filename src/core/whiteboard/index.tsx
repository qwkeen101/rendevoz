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
import { useGlobalAtomValue } from '@/hooks'
import useWhiteboardSidebar from './useWhiteboardSidebar'
import { Rendevoz } from '../rendevoz'

const WhiteboardInner = memo(({ id, enableMiniMap = true }: { id: number; enableMiniMap?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const flow = useFlow()
  const panzoomRef = useRef<PanZoom>()
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = useMemo(() => new GlobalEventHandler(), [])
  const scopedEmitter = useScopedEventEmitter()
  const whiteboard = useAtomValue(WhiteboardAtom)
  const { addTab, render } = useWhiteboardSidebar()
  const [setting] = useSetting()
  useLayoutEffect(() => {
    if (flow && containerRef.current) {
      emitter.addListener('global', handler)
      flow.containerEle = containerRef.current
      flow.parentContainerEle = flow.containerEle.parentElement as HTMLElement
      containerRef.current?.style.setProperty('--zoom-level', '1')
      const panzoom = createPanZoom(containerRef.current, {
        smoothScroll: false,
        maxZoom: 5,
        minZoom: 0.0625,
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
        }
      })
      panzoomRef.current = panzoom
      panzoom.on('pan', e => {
        scopedEmitter.emit('whiteboard', {
          type: 'panChange'
        })
      })
      panzoom.on('zoom', e => {
        const { scale } = panzoom.getTransform()
        flow.containerTransformScale = scale
        const zoomMultipler = Math.sqrt(1 / scale)
        scopedEmitter.emit('whiteboard', {
          type: 'zoomChange',
          data: {
            zoomLevel: scale,
            zoomMultiplier: zoomMultipler
          }
        })
        containerRef.current?.style.setProperty('--zoom-level', String(zoomMultipler))
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
      panzoom?.zoomTo(0, 0, lastViewport.scale)
      panzoom?.moveTo(lastViewport.x, lastViewport.y)
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
  return (
    <Content fullHeight fullWidth role="data-container" tabIndex={undefined}>
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
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0 }}>{render()}</div>
      <div
        style={{
          position: 'absolute',
          left: 15,
          top: 15
        }}
      >
        <WhiteboardSetting />
      </div>
      {enableMiniMap && setting.whiteboard.enableMinimap && (
        <div
          style={{
            position: 'absolute',
            right: 15,
            bottom: 15
          }}
        >
          <WhiteboardMiniMap />
        </div>
      )}
    </Content>
  )
})

export const Whiteboard = memo(
  ({
    whiteboardId,
    onTabTitleChange,
    enableMiniMap
  }: {
    whiteboardId: number
    onTabTitleChange?: (s?: string) => void
    enableMiniMap?: boolean
  }) => {
    const previousWhiteboard = useRef<IWhiteboard>()
    const whiteboardAtom = ObjectStore('whiteboard').createAtom(whiteboardId)
    const whiteboard = useGlobalAtomValue(whiteboardAtom)
    const store = useMemo(() => {
      const store = createStore()
      const whiteboard = globalStore.get(whiteboardAtom)
      console.log(whiteboard)
      previousWhiteboard.current = whiteboard
      store.set(WhiteboardAtom, whiteboard)
      const flowManager = new FlowManager()
      flowManager.whiteboardId = whiteboardId
      store.set(FlowAtom, flowManager)
      onTabTitleChange?.(whiteboard?.name)
      return store
    }, [whiteboard?.id])
    useEffect(() => {
      const unsub = globalStore.sub(whiteboardAtom, () => {
        const whiteboard = globalStore.get(whiteboardAtom)
        const prev = previousWhiteboard.current
        console.log('sub change')
        console.log(whiteboard, prev)
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
    return <Provider store={store}>{whiteboardId && <WhiteboardInner id={whiteboardId} enableMiniMap={enableMiniMap} />}</Provider>
  }
)
