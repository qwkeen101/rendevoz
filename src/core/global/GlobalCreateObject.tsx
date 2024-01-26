import { MetaStore } from '@/api/stores'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MetaLink, MetaObject } from '~/typings/data'
import ObjectForm from '@/components/form/ObjectForm'
import { useEventHandler } from '@/events'
import { useToggle } from '@/hooks'
import { Modal } from '@/components'
import Id from '@/utils/id'
import { Rendevoz } from '../rendevoz'

const GlobalCreateObject = () => {
  const [innerMeta, setInnerMeta] = useState<Partial<MetaObject>>()
  const [pendingLinks, setPendingLinks] = useState<MetaLink[]>()
  const [modalVisible, toggleModalVisible] = useToggle(false)
  const globalEventEmitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = useEventHandler('global')
  const currentModeRef = useRef<'add' | 'edit'>()
  handler.on('globalNeedAddMetaObject', (data, res, rej) => {
    promiseRef.current = {
      res: res || promiseRef.current?.res,
      rej: rej || promiseRef.current?.rej
    }
    if (data) {
      const { fromMetas, currentObject } = data
      const shouldAddObject = { id: Id.getId(), ...currentObject }
      MetaStore.addMetaObject(shouldAddObject)
      setInnerMeta(shouldAddObject)
      if (fromMetas) {
        const links = fromMetas.map(
          i =>
            ({
              id: Id.getId(),
              sourceId: i.id,
              targetId: shouldAddObject.id
            }) as MetaLink
        )
        console.log(links)
        links.forEach(i => MetaStore.addMetaLink(i, true))
        setPendingLinks(links)
      }
    }

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

  useEffect(() => {
    globalEventEmitter.addListener('global', handler)
    return () => {
      globalEventEmitter.removeListener('global', handler)
    }
  }, [])
  useEffect(() => {
    if (modalVisible === false) {
      setInnerMeta(undefined)
    }
  }, [modalVisible])

  const handleCancelCreate = () => {
    toggleModalVisible(false)
    promiseRef.current?.rej?.(null)
    promiseRef.current = undefined
    if (currentModeRef.current === 'add') {
      innerMeta?.id &&
        MetaStore.deleteMetaObject(innerMeta?.id, {
          force: true,
          silent: true
        })
      pendingLinks?.forEach(i => {
        if (i.id) {
          MetaStore.deleteMetaLink(i.id, true, true)
        }
      })
    }
    setPendingLinks(undefined)
  }
  return createPortal(
    <>
      <Modal
        noStyle={true}
        visible={modalVisible}
        zIndex={9000}
        onClose={() => {
          handleCancelCreate()
        }}
      >
        <ObjectForm
          shouldPreviewGraph={!!pendingLinks?.length}
          initialObject={innerMeta}
          onBack={handleCancelCreate}
          key={innerMeta?.id}
          onSubmit={obj => {
            toggleModalVisible(false)
            setTimeout(() => {
              if (currentModeRef.current === 'add') {
                if (innerMeta?.id) {
                  MetaStore.updateMetaObject(obj).then(obj => {
                    promiseRef.current?.res?.(obj)
                    promiseRef.current = undefined
                  })
                } else {
                  MetaStore.addMetaObject(obj).then(obj => {
                    promiseRef.current?.res?.(obj)
                    promiseRef.current = undefined
                  })
                }
              }
              if (currentModeRef.current === 'edit') {
                MetaStore.updateMetaObject({ ...obj }).then(obj => {
                  promiseRef.current?.res?.(obj)
                  promiseRef.current = undefined
                })
              }
              setPendingLinks(undefined)
            }, 300)
          }}
        />
      </Modal>
    </>,
    document.body,
    'global-create-object-form'
  )
}

export default GlobalCreateObject
