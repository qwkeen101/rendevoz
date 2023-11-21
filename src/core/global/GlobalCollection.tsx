import { useState } from 'react'
import { Modal } from '@/components'
import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import ChooseCollectionForm from '@/components/form/quickAdd/ChooseCollectionForm'
import { CollectionStore } from '@/api/stores'

export default () => {
  const [collectionState, setCollectionState] = useState<{
    visible: boolean
    promise: {
      resolve: any
      reject: any
    }
  }>()
  assignProperties(GlobalInstance, {
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
        const c = await new Promise((resolve, reject) => {
          setCollectionState({
            visible: true,
            promise: {
              reject,
              resolve
            }
          })
        })
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
    <Modal onClose={handleCancel} visible={!!collectionState?.visible} zIndex={8000}>
      <ChooseCollectionForm
        onCancel={handleCancel}
        onChoose={c => {
          collectionState?.promise.resolve(c)
          setCollectionState(undefined)
        }}
      />
    </Modal>
  )
}
