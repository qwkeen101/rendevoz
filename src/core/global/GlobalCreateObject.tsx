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
import { GlobalEventEmitter, useEventHandler, useGlobalEventEmitter } from '@/events'
import { useToggle } from '@/hooks'
import { Modal } from '@/components'
import { useCreateObject } from '../database'

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
  const { portal, openAtCenter } = useCreateObject({ positions: ['top'] })
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
        openAtCenter()
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
      {portal}
    </>,
    document.body,
    'global-create-object-form'
  )
}

export default GlobalCreateObject
