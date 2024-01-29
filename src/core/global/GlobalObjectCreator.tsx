import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { useRef, useState } from 'react'
import { Modal } from '@/components'
import FileImporter from '@/components/fileImporter'
import { MetaObject } from '~/typings'
import { ObjectStore } from '@/api/stores'
import GroupStore from '../../api/stores/group.store'

export const ObjectCreateHandler: Partial<
  Record<
    MetaObject['type'],
    () => Promise<{
      meta: MetaObject
      one: any
    }>
  >
> = {
  note: () => ObjectStore('note').addOneWithMeta({}),
  whiteboard: () => ObjectStore('whiteboard').addOneWithMeta({}),
  group: () => ObjectStore('group').addOneWithMeta(GroupStore.initializeGroup()),
  code: () => ObjectStore('code').addOneWithMeta({ content: '' }),
  question: () => ObjectStore('question').addOneWithMeta(),
  video: () =>
    ObjectStore('video').addOneWithMeta(
      {},
      {
        showMetaModal: true
      }
    ),

  image: () =>
    ObjectStore('image').addOneWithMeta(
      {},
      {
        showMetaModal: true
      }
    ),
  audio: () =>
    ObjectStore('audio').addOneWithMeta(
      {},
      {
        showMetaModal: true
      }
    ),
  webpage: () =>
    ObjectStore('webpage').addOneWithMeta(
      {},
      {
        showMetaModal: true
      }
    ),
  localFile: () => ObjectStore('localFile').addOneWithMeta({}, { showMetaModal: true }),
  pdf: () =>
    ObjectStore('pdf').addOneWithMeta(
      {},
      {
        showMetaModal: true
      }
    )
}
export default () => {
  const [visible, setVisible] = useState(false)
  const callbackRef = useRef<{
    resolve: typeof Promise.resolve
    reject: typeof Promise.reject
  }>()
  assignProperties(GlobalInstance, {
    metaOps: {
      ...GlobalInstance.metaOps,
      createObject: type => {
        if (type) {
          if (ObjectCreateHandler[type]) {
            return new Promise(res => {
              ObjectCreateHandler[type]?.().then(o => res(o.meta))
            })
          } else {
            return Promise.reject()
          }
        }
        setVisible(true)
        return new Promise((resolve, reject) => {
          callbackRef.current = {
            reject,
            resolve
          }
        })
      }
    }
  })
  return (
    <Modal visible={visible} onClose={() => setVisible(false)}>
      <FileImporter
        onClose={() => setVisible(false)}
        onCreate={object => {
          setVisible(false)
          setTimeout(() => {
            callbackRef.current?.resolve(object)
            setTimeout(() => {
              callbackRef.current = undefined
            })
          }, 200)
        }}
        autoOpen={false}
      />
    </Modal>
  )
}
