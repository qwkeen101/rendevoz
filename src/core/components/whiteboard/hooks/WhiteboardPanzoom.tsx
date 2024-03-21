import { useFlow, WhiteboardAtom } from '@/core/components/whiteboard/StateHooks'
import { memo, useEffect, useRef } from 'react'
import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { PanZoom } from 'panzoom'
import { useDebounceFn, useSelectAtomValue } from '@/hooks'
import { useSetAtom, useStore } from 'jotai'
import { WhiteboardTransformAtom } from '@/core/components/whiteboard/hooks/useWhiteboardTransform'
import { createPanZoom } from '@/core/components/whiteboard/panzoom'
import { ObjectStore } from '@/api/stores'
import { assignProperties } from '@/utils'
import { getSetting } from '@/core'

const WhiteboardPanzoom = memo(({ onInitialized }: { onInitialized?: VoidFunction }) => {
  const flow = useFlow()
  const panzoomRef = useRef<PanZoom>()
  const store = useStore()
  const setWhiteboardTransform = useSetAtom(WhiteboardTransformAtom)
  const instance = useWhiteboardInstance()
  const debounceUpdateLastViewport = useDebounceFn(
    () => {
      const transform = panzoomRef.current?.getTransform()
      transform &&
        ObjectStore('whiteboard').updateOne(
          {
            id: flow.whiteboardId,
            lastViewport: transform
          },
          { silent: true }
        )
    },
    { wait: 200 }
  )
  // attach panzoom to container
  useEffect(() => {
    const container = instance.getContainerNode?.()
    if (container) {
      const scopedEmitter = instance.eventEmitter
      if (!scopedEmitter) return
      const panzoom = createPanZoom(container, {
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
          console.log(e)
          const pointerMode = flow.parentContainerEle?.getAttribute('data-pointer-mode')
          if (pointerMode === 'pan') {
            return false
          }

          if (e.target?.closest('textarea,input,[contenteditable]')) return true
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
          const setting = getSetting()
          const pointerMode = flow.parentContainerEle?.getAttribute('data-pointer-mode')
          if (e.defaultPrevented) {
            return true
          }
          if (pointerMode === 'pan') {
            return false
          }
          if (setting.whiteboard.scrollModeInSelect === 'zoom') {
            return false
          }
          if (e.ctrlKey || e.metaKey) {
            return false
          }
          const curr = panzoom.getTransform()
          if (e.deltaX !== 0 || e.deltaY !== 0) {
            panzoom.setTransform(
              {
                x: curr.x - e.deltaX,
                y: curr.y - e.deltaY,
                scale: curr.scale
              },
              500,
              true
            )

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
      const lastViewport = store.get(WhiteboardAtom)?.lastViewport
      panzoomRef.current = panzoom
      assignProperties(instance, {
        getTransform: () => {
          const t = panzoomRef.current?.getTransform()
          if (!t) throw 'Failed to get transform!'
          return t
        }
      })
      panzoom.on('pan', e => {
        scopedEmitter.emit('whiteboard', {
          type: 'panChange'
        })
        const t = panzoom.getTransform()
        setWhiteboardTransform([t.x, t.y, t.scale])
        debounceUpdateLastViewport.run()
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
        debounceUpdateLastViewport.run()
      })
      flow.panzoom = panzoom
      if (lastViewport) {
        setWhiteboardTransform([lastViewport.x, lastViewport.y, lastViewport.scale])
        panzoom?.zoomTo(0, 0, lastViewport.scale)
        panzoom?.moveTo(lastViewport.x, lastViewport.y)
      } else {
        setWhiteboardTransform([0, 0, 1])
      }
      onInitialized?.()
      return () => {
        flow.dispose()
        panzoom.dispose()
      }
    }
  }, [])

  const [whiteboardState, setWhiteboardState] = useWhiteboardState()

  let containerCursor = 'default'
  if (whiteboardState.currentTool) {
    containerCursor = 'crosshair'
  }
  if (whiteboardState.isPanning) {
    containerCursor = 'grabbing'
  } else {
    if (whiteboardState.pointerMode === 'pan') {
      containerCursor = 'grab'
    }
  }

  useEffect(() => {
    instance.getOutestContainerNode?.()?.style.setProperty('cursor', containerCursor)
  }, [containerCursor])

  const debounceSetZoom = useDebounceFn(
    (zoom: number) => {
      const container = instance.getContainerNode?.()
      if (container) {
        container.style.setProperty('--zoom-level', String(zoom))
      }
    },
    { wait: 50 }
  )

  useEffect(() => {
    const container = flow.parentContainerEle

    // middle button can move the whiteboard whatever state it is
    const middleButtonPressed = {
      current: false
    }
    const spacePressed = {
      current: false
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.type === 'keydown' && isHotkey(KEY.Space, e)) {
        spacePressed.current = true
        setWhiteboardState(s => ({ ...s, pointerMode: 'pan' }))
      }
      if (e.type === 'keyup') {
        if (!middleButtonPressed.current && spacePressed.current) {
          setWhiteboardState(s => ({ ...s, pointerMode: s.toolbarPointerMode }))
        }
        spacePressed.current = false
      }
    }
    const pointerDownUpHandler = (e: PointerEvent) => {
      if (e.type === 'pointermove' && (e.buttons === 2 || e.buttons === 4)) {
        if (middleButtonPressed.current === false) {
          setWhiteboardState(s => ({ ...s, isPanning: true, pointerMode: 'pan', panStartTransform: instance.getTransform?.() }))
          middleButtonPressed.current = true
        }
      }
      if (e.type === 'pointerup') {
        middleButtonPressed.current = false
        setWhiteboardState(s => ({ ...s, isPanning: false, pointerMode: s.toolbarPointerMode }))
      }
    }
    if (container) {
      document.addEventListener('keydown', keyHandler)
      document.addEventListener('keyup', keyHandler)
      container.addEventListener('pointermove', pointerDownUpHandler)
      container.addEventListener('pointerup', pointerDownUpHandler)
      return () => {
        document.removeEventListener('keydown', keyHandler)
        document.removeEventListener('keyup', keyHandler)
        container.removeEventListener('pointermove', pointerDownUpHandler)
        container.removeEventListener('pointerup', pointerDownUpHandler)
      }
    }
  }, [])

  useEffect(() => {
    const container = flow.parentContainerEle
    if (container && whiteboardState.pointerMode) {
      container.setAttribute('data-pointer-mode', whiteboardState.pointerMode)
    }
    container?.setAttribute('data-is-panning', whiteboardState.isPanning ? 'true' : 'false')
    if (whiteboardState.pointerMode === 'pan' && container) {
      const pointerHandler = (e: PointerEvent) => {
        if (e.type === 'pointerdown') {
          setWhiteboardState(s => ({ ...s, isPanning: true }))
        } else {
          setWhiteboardState(s => ({ ...s, isPanning: false }))
        }
      }
      container.addEventListener('pointerdown', pointerHandler)
      container.addEventListener('pointerup', pointerHandler)
      return () => {
        container.removeEventListener('pointerdown', pointerHandler)
        container.removeEventListener('pointerup', pointerHandler)
      }
    }
  }, [whiteboardState.pointerMode, whiteboardState.isPanning])

  return null
})

export default WhiteboardPanzoom
