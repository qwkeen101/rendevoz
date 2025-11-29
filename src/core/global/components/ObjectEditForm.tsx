import { MetaStore } from '@/api/stores'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MetaObject } from '~/typings/data'
import ObjectForm from '@/components/form/ObjectForm'
import { useToggle } from '@/hooks'
import { Modal } from '@/components'
import { assignProperties } from '@/utils'

export default () => {
  const [innerMeta, setInnerMeta] = useState<Partial<MetaObject>>()
  const [modalVisible, toggleModalVisible] = useToggle(false)

  assignProperties(Global, {
    metaOps: {
      ...Global.metaOps,
      edit: id => {
        return new Promise<MetaObject>((res, rej) => {
          promiseRef.current = {
            res: res || promiseRef.current?.res,
            rej: rej || promiseRef.current?.rej
          }
          const metaObject = MetaStore.getCachedMetaObject(id)
          if (metaObject) {
            setInnerMeta({ ...metaObject })
            toggleModalVisible(true)
            currentModeRef.current = 'edit'
          }
        })
      },
      openCreateForm: current => {
        return new Promise<MetaObject>((res, rej) => {
          promiseRef.current = {
            res: res || promiseRef.current?.res,
            rej: rej || promiseRef.current?.rej
          }
          setInnerMeta({ ...current })
          toggleModalVisible(true)
          currentModeRef.current = 'add'
        })
      }
    }
  })
  const currentModeRef = useRef<'add' | 'edit'>()
  const promiseRef = useRef<{
    res?: (v: any) => void
    rej?: (v: any) => void
  }>()
  useEffect(() => {
    if (modalVisible === false) {
      setInnerMeta(undefined)
    }
  }, [modalVisible])

  const handleCancelCreate = () => {
    toggleModalVisible(false)
    promiseRef.current?.rej?.(null)
    promiseRef.current = undefined
  }
  return createPortal(
    <>
      <Modal
        noStyle={true}
        visible={modalVisible}
        zIndex={1000}
        onClose={() => {
          handleCancelCreate()
        }}
      >
        <ObjectForm
          initialObject={innerMeta}
          onBack={handleCancelCreate}
          key={innerMeta?.id}
          onSubmit={obj => {
            toggleModalVisible(false)
            setTimeout(() => {
              const newObj = { ...obj, temp: false }
              if (currentModeRef.current === 'add') {
                if (innerMeta?.id) {
                  MetaStore.updateMetaObject(newObj).then(obj => {
                    promiseRef.current?.res?.(obj)
                    promiseRef.current = undefined
                  })
                } else {
                  MetaStore.addMetaObject(newObj).then(obj => {
                    promiseRef.current?.res?.(obj)
                    promiseRef.current = undefined
                  })
                }
              }
              if (currentModeRef.current === 'edit') {
                MetaStore.updateMetaObject(newObj).then(obj => {
                  promiseRef.current?.res?.(obj)
                  promiseRef.current = undefined
                })
              }
            }, 300)
          }}
        />
      </Modal>
    </>,
    document.body
  )
}
