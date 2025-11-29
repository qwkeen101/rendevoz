import { assignProperties, Id } from '@/utils'
import { useEffect, useRef, useState } from 'react'
import { Modal } from '@/components'
import FileImporter from '@/api/components/objectImporter'
import { MetaObject } from '~/typings'
import { ObjectStore, GroupStore } from '@/api/stores'
import { IFileUploaderTab } from '@/api/components/objectImporter/ObjectFileUploader'
import { range } from 'lodash'

export const ObjectCreateHandler: Partial<
  Record<
    MetaObject['type'],
    (opts?: { name?: string; tags?: number[] }) => Promise<{
      meta: MetaObject
      one: any
    }>
  >
> = {
  note: opts => ObjectStore('note').addOneWithMeta({}, { currentMeta: opts }),
  whiteboard: opts => ObjectStore('whiteboard').addOneWithMeta({}, { currentMeta: opts }),
  group: opts => ObjectStore('group').addOneWithMeta(GroupStore.initializeGroup(), { currentMeta: opts }),
  question: opts => ObjectStore('question').addOneWithMeta({}, { currentMeta: opts }),
  chat: opts => ObjectStore('chat').addOneWithMeta({ messages: [] }, { currentMeta: opts }),
  exam: async opts => {
    const examId = Id.getId()
    const q1 = await ObjectStore('examQuestion').addOne({
      type: 'text',
      parentObjectId: examId
    })
    const q2 = await ObjectStore('examQuestion').addOne({
      type: 'singleSelect',
      parentObjectId: examId,
      choices: range(0, 3).map(() => ({ id: Id.getId(), name: '' }))
    })
    return await ObjectStore('exam').addOneWithMeta({ questions: [q1.id, q2.id], id: examId }, { currentMeta: opts })
  }
}
export default () => {
  const [visible, setVisible] = useState(false)
  const createHandlerRef = useRef<(o: MetaObject, trigger?: boolean) => void>()
  const parentCollectionRef = useRef<number>()
  const [defaultTab, setDefaultTab] = useState<IFileUploaderTab>()
  useEffect(() => {
    if (!visible) {
      setDefaultTab(undefined)
    }
  }, [visible])
  assignProperties(Global, {
    metaOps: {
      ...Global.metaOps,
      openUploaderTab: t => {
        setDefaultTab(t)
        setTimeout(() => setVisible(true))
      },
      createObjects: (type, onMetaCreated, opts) => {
        const handleCreate = (m: MetaObject, trigger?: boolean) => {
          if (trigger && opts?.openAfterTriggerOnce) {
            Global.layoutOps?.openObject(m.id)
          }
          onMetaCreated?.(m)
        }
        parentCollectionRef.current = opts?.parentCollectionId
        createHandlerRef.current = handleCreate
        if (type) {
          if (ObjectCreateHandler[type]) {
            ObjectCreateHandler[type]?.().then(o => handleCreate?.(o.meta, true))
          }
          return
        }
        setVisible(true)
      }
    }
  })
  return (
    <Modal visible={visible} onClose={() => setVisible(false)}>
      <FileImporter
        defaultTab={defaultTab}
        onClose={() => setVisible(false)}
        parentCollectionId={parentCollectionRef.current}
        onCreate={(object, trigger) => {
          setVisible(false)
          createHandlerRef.current?.(object, trigger)
        }}
      />
    </Modal>
  )
}
