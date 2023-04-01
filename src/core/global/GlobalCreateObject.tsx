import Zindexes from '@/consts/zindex'
import { MetaStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { Position } from '@/types'
import { compareHotkey } from 'is-hotkey'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Rnd } from 'react-rnd'
import { MetaObject } from '~/typings/data'
import ObjectForm from '@/components/form/ObjectForm'
import getSetting from '@/core/setting/getSetting'
import { useEventHandler, useGlobalEventEmitter } from '@/events'
import { useToggle } from '@/hooks'
import { Modal } from '@/components'

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
  const [modalVisible, toggleModalVisible] = useToggle(false)
  const globalEventEmitter = useGlobalEventEmitter()
  const handler = useEventHandler('global')
  const currentModeRef = useRef<'add' | 'edit'>()
  handler.on('globalNeedAddMetaObject', ({ currentObject }, res, rej) => {
    promiseRef.current = {
      res: res || promiseRef.current?.res,
      rej: rej || promiseRef.current?.rej
    }
    setInnerMeta({ ...currentObject })
    toggleModalVisible(true)
    currentModeRef.current = 'add'
  })
  handler.on('globalNeedEditMetaObject', async ({ metaObjectId }, res, rej) => {
    promiseRef.current = {
      res: res || promiseRef.current?.res,
      rej: rej || promiseRef.current?.rej
    }
    const metaObject = await MetaStore.getMetaObjectById(metaObjectId)
    if (metaObject) {
      setInnerMeta({ ...metaObject })
      toggleModalVisible(true)
      currentModeRef.current = 'edit'
    }
  })
  const promiseRef = useRef<{
    res?: (v: any) => void
    rej?: (v: any) => void
  }>()
  const { addMetaObject } = MetaStore
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
    globalEventEmitter.addListener('global', handler)
    const keyDownHandler = (e: KeyboardEvent) => {
      const createObjectShortCut = getSetting().shortcut.quickCreateObject
      if (createObjectShortCut && compareHotkey(createObjectShortCut, e)) {
        setPanelState(s => ({ ...s, visible: !s.visible }))
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      globalEventEmitter.removeListener('global', handler)
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [])
  return createPortal(
    <>
      <Modal noStyle visible={modalVisible} onClose={toggleModalVisible}>
        <ObjectForm
          initialObject={innerMeta}
          onBack={() => {
            toggleModalVisible(false)
            promiseRef.current?.rej?.(null)
            promiseRef.current = undefined
          }}
          onSubmit={obj => {
            console.log(obj)
            if (currentModeRef.current === 'add') {
              MetaStore.addMetaObject(obj).then(obj => {
                promiseRef.current?.res?.(obj)
                promiseRef.current = undefined
              })
            }
            if (currentModeRef.current === 'edit') {
              MetaStore.updateMetaObject({ ...obj }).then(obj => {
                promiseRef.current?.res?.(obj)
                promiseRef.current = undefined
              })
            }
            toggleModalVisible(false)
          }}
        />
      </Modal>
      {panelState.visible && (
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
            dragHandleClassName={ClassName.title('14px')}
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
            <ObjectForm
              onBack={() => {
                setPanelState(s => ({ ...s, visible: false }))
                const promise = promiseRef.current
                promiseRef.current = undefined
                if (promise) {
                  promise.rej?.(null)
                }
              }}
              onSubmit={obj => {
                const promise = promiseRef.current
                promiseRef.current = undefined
                if (promise) {
                  promise.res?.(obj)
                }
                setPanelState(s => ({ ...s, visible: false }))
                addMetaObject(obj)
              }}
            />
          </Rnd>
        </div>
      )}
    </>,
    document.body,
    'global-create-object-form'
  )
}

export default GlobalCreateObject
