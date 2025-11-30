import { Provider, useSetAtom, useStore } from 'jotai/react'
import { memo, useEffect, useMemo, useRef } from 'react'
import { WhiteboardProps } from './types/whiteboard'
import { WhiteboardInstanceAtom, WhiteboardStateAtom, WhiteboardAtom, createWhiteboardStore, normalizeWhiteboard } from './core/store'
import { usePanzoom } from './core/panzoom'
import { usePointerBridge } from './core/pointer'
import Canvas from './components/Canvas'
import SelectionOverlay from './components/SelectionOverlay'
import Toolbar from './components/Toolbar'
import useHistoryShortcut from './core/historyShortcut'
import useKeyboardShortcuts from './core/keyboard'
import useClipboardShortcut from './core/clipboardShortcut'

const WhiteboardCanvas = memo(() => {
  // Placeholder for future rendering; currently acts as a focusable container and event bridge.
  const store = useStore()
  const instance = store.get(WhiteboardInstanceAtom)
  const ref = useRef<HTMLDivElement>(null)

  usePanzoom({ containerRef: ref, instance })
  usePointerBridge(instance)
  useHistoryShortcut()
  useKeyboardShortcuts()
  useClipboardShortcut()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    instance.getOutestContainerNode = () => el
    const handlePointerDown = (e: PointerEvent) => instance.emit?.({ type: 'pointerdown', e })
    const handlePointerMove = (e: PointerEvent) => instance.emit?.({ type: 'pointermove', e })
    const handlePointerUp = (e: PointerEvent) => instance.emit?.({ type: 'pointerup', e })
    el.addEventListener('pointerdown', handlePointerDown)
    el.addEventListener('pointermove', handlePointerMove)
    el.addEventListener('pointerup', handlePointerUp)
    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerup', handlePointerUp)
    }
  }, [instance])

  return (
    <div
      ref={ref}
      role="whiteboard"
      tabIndex={0}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        outline: 'none',
        overflow: 'hidden',
        background: '#f8fafc'
      }}
      onFocus={() => instance.setFocused?.(true)}
      onBlur={() => instance.setFocused?.(false)}
    >
      <Canvas />
      <SelectionOverlay />
      <Toolbar />
    </div>
  )
})

const WhiteboardInner = memo(
  ({
    value,
    layout,
    readOnly,
    name,
    state,
    adapter,
    edgeSnapRadius,
    edgeSnapPrefer,
    edgeHandleOffset,
    edgeStyleResolver,
    nodeRenderers,
    snapMode
  }: Omit<WhiteboardProps, 'onChange' | 'onPatch'>) => {
    const setWhiteboardAtom = useSetAtom(WhiteboardAtom)
    const setWhiteboardState = useSetAtom(WhiteboardStateAtom)

    useEffect(() => {
      setWhiteboardAtom(normalizeWhiteboard(value))
    }, [value, setWhiteboardAtom])

    useEffect(() => {
      setWhiteboardState(s => ({
        ...s,
        readOnly,
        name,
        layout: layout ?? s.layout,
        state: state ?? s.state,
        edgeSnapRadius: edgeSnapRadius ?? s.edgeSnapRadius,
        edgeSnapPrefer: edgeSnapPrefer ?? s.edgeSnapPrefer,
        edgeHandleOffset: edgeHandleOffset ?? s.edgeHandleOffset,
        edgeStyleResolver: edgeStyleResolver ?? s.edgeStyleResolver,
        nodeRenderers: nodeRenderers ?? s.nodeRenderers,
        snapMode: snapMode ?? s.snapMode
      }))
    }, [layout, readOnly, state, name, edgeSnapRadius, edgeSnapPrefer, edgeHandleOffset, edgeStyleResolver, nodeRenderers, snapMode, setWhiteboardState])

    useEffect(() => {
      if (adapter?.settings?.get) {
        const settings = adapter.settings.get()
        setWhiteboardState(s => ({
          ...s,
          ...settings
        }))
      }
    }, [adapter, setWhiteboardState])

    return <WhiteboardCanvas />
  }
)

export const Whiteboard = memo((props: WhiteboardProps) => {
  const { value, onChange, onPatch, adapter, ...rest } = props

  const { store } = useMemo(
    () =>
      createWhiteboardStore({
        value,
        onChange,
        onPatch,
        adapter
      }),
    []
  )

  return (
    <Provider store={store}>
      <WhiteboardInner {...rest} value={value} />
    </Provider>
  )
})

export default Whiteboard
