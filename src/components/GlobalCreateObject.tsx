import Zindexes from '@/consts/zindex'
import { metaStore } from '@/stores'
import { Position } from '@/types'
import { compareHotkey } from 'is-hotkey'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Rnd } from 'react-rnd'
import { MetaObject } from '~/typings/data'
import EditMetaObjectForm from './form/EditMetaObjectForm'
import getSetting from './globalSetting/getSetting'

const GlobalCreateObjectInstance: Partial<{
  create: (preObject?: Partial<MetaObject>) => Promise<MetaObject>
}> = {}
const GlobalCreateObject = () => {
  const [innerMeta, setInnerMeta] = useState<Partial<MetaObject>>()
  const [panelState, setPanelState] = useState<
    Partial<{
      visible: boolean
      position: Position
      size: { width: number | string; height: number | string }
    }>
  >({
    visible: false,
    size: {
      width: 'auto',
      height: 'auto'
    },
    position: {
      left: 300,
      top: 300
    }
  })

  const promiseRef = useRef<{
    res: (v: any) => void
    rej: (v: any) => void
  }>()
  const { addMetaObject } = metaStore
  Object.assign(GlobalCreateObjectInstance, {
    create: obj => {
      return new Promise((res, rej) => {
        setInnerMeta(obj)
        promiseRef.current = {
          res,
          rej
        }
        setPanelState(s => ({ ...s, visible: true }))
      })
    }
  } as typeof GlobalCreateObjectInstance)
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      const createObjectShortCut = getSetting().shortcut.quickCreateObject
      if (createObjectShortCut && compareHotkey(createObjectShortCut, e)) {
        setPanelState(s => ({ ...s, visible: !s.visible }))
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [])
  return createPortal(
    panelState.visible && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          zIndex: Zindexes.CreateObjectPanel,
          pointerEvents: 'none'
        }}
      >
        <Rnd
          position={{
            x: panelState.position?.left,
            y: panelState.position?.top
          }}
          maxWidth={600}
          minWidth={400}
          size={panelState.size}
          enableResizing={{
            left: true,
            right: true
          }}
          style={{
            pointerEvents: 'auto'
          }}
          onResizeStop={(e, dir, ele, delta, pos) => {
            const bound = ele.getBoundingClientRect()
            setPanelState({
              ...panelState,
              size: {
                width: bound.width,
                height: bound.height
              },
              position: {
                left: pos.x,
                top: pos.y
              }
            })
          }}
          onDragStop={(e, data) => {
            setPanelState({
              ...panelState,
              position: {
                left: data.x,
                top: data.y
              }
            })
          }}
        >
          <EditMetaObjectForm
            metaObject={innerMeta}
            onClose={() => {
              setPanelState(s => ({ ...s, visible: false }))
              const promise = promiseRef.current
              promiseRef.current = undefined
              if (promise) {
                promise.rej(null)
              }
            }}
            onUpdate={obj => {
              const promise = promiseRef.current
              promiseRef.current = undefined
              if (promise) {
                promise.res(obj)
              }
              setPanelState(s => ({ ...s, visible: false }))
              addMetaObject(obj)
            }}
            title="Create Object"
          />
        </Rnd>
      </div>
    ),
    document.body,
    'global-create-object-form'
  )
}

export default GlobalCreateObject
