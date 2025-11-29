import { useState } from 'react'
import { Modal } from '@/components'
import { assignProperties } from '@/utils'
import ChooseCollectionForm from '@/components/form/quickAdd/ChooseCollectionForm'
import { CollectionStore } from '@/api/stores'
import { ICollection } from '~/typings'

export default () => {
  const [collectionState, setCollectionState] = useState<{
    visible: boolean
    promise: {
      resolve: any
      reject: any
    }
  }>()
  assignProperties(Global, {
    collectionOps: {
      selectCollection: () => {
        return new Promise((resolve, reject) => {
          setCollectionState({
            visible: true,
            promise: {
              reject,
              resolve
            }
          })
        })
      },
      addMetaIntoCollection: async meta => {
        const c = (await new Promise((resolve, reject) => {
          setCollectionState({
            visible: true,
            promise: {
              reject,
              resolve
            }
          })
        })) as ICollection
        if (c) {
          CollectionStore.addItemToCollection({ type: 'meta', id: meta }, c.id)
        }
      }
    }
  })
  const handleCancel = () => {
    collectionState?.promise.reject?.()
    setCollectionState(undefined)
  }
  return (
    <Modal style={{ overflow: 'hidden' }} onClose={handleCancel} visible={!!collectionState?.visible} zIndex={8000}>
      <ChooseCollectionForm
        onClose={handleCancel}
        enableRoot
        onChange={c => {
          if (c === 0) {
            collectionState?.promise.resolve(0)
            setCollectionState(undefined)
          }
          const cache = CollectionStore.getCachedCollectionById(c)
          if (cache) {
            collectionState?.promise.resolve(cache)
            setCollectionState(undefined)
          } else {
            handleCancel()
          }
        }}
      />
    </Modal>
  )
}
