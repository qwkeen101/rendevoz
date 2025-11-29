import { useEffect } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { fetchMetaNoteContent } from '@/api/stores/utils.store'
import { Node } from 'slate'
import { useSlateStatic } from '@/core'
import { pushNumberIntoUnrepeatableArray } from '@/utils'
import useEditorInstance from '../hooks/useEditorInstance'

const useCheckSyncInWhere = (metaId: number) => {
  const instance = useEditorInstance()
  const check = async () => {
    const syncMeta = await MetaStore.getMetaObjectById(metaId)
    if (syncMeta?.objectId) {
      const object = await ObjectStore('syncedBlock').getOneById(syncMeta.objectId)
      if (object) {
        if (!object.lastCheckTime || Date.now() - object.lastCheckTime > 30000) {
          const asyncChecks = object.syncedMetaIds.map(async id => {
            const meta = await MetaStore.getMetaObjectById(id)
            let deleteThis = false
            if (meta && meta.objectId) {
              if (meta.type === 'whiteboard') {
                const nodes = await ObjectStore('whiteboard').getOneById(meta.objectId)
                if (!nodes?.nodes || !Array.from(nodes?.nodes?.values()).some(i => i.type === 'metaObject' && i.metaObjectId === metaId)) {
                  deleteThis = true
                }
              } else {
                const noteValue = await fetchMetaNoteContent(id)
                if (noteValue) {
                  let hasThis = false
                  for (const [element, path] of Node.elements({ children: noteValue })) {
                    if (element.originId === metaId) {
                      hasThis = true
                      break
                    }
                  }
                  if (!hasThis) {
                    deleteThis = true
                  }
                }
              }
            } else {
              deleteThis = true
            }

            return {
              deleteThis,
              id
            }
          })
          const newSyncs = (await Promise.all(asyncChecks)).filter(i => !i.deleteThis).map(i => i.id)
          if (newSyncs.length !== object.syncedMetaIds.length) {
            ObjectStore('syncedBlock').updateOne({ id: object.id, syncedMetaIds: newSyncs, lastCheckTime: Date.now() })
          } else {
            ObjectStore('syncedBlock').updateOne({ id: object.id, lastCheckTime: Date.now() })
          }
        }
      }
    }
  }
  const checkIsInThis = async () => {
    const noteMeta = instance.values.metaId
    if (noteMeta) {
      const syncMeta = await MetaStore.getMetaObjectById(metaId)
      if (syncMeta?.objectId) {
        const object = await ObjectStore('syncedBlock').getOneById(syncMeta.objectId)
        if (!object?.syncedMetaIds.includes(noteMeta)) {
          ObjectStore('syncedBlock').updateOne({
            id: object?.id,
            syncedMetaIds: pushNumberIntoUnrepeatableArray(noteMeta, object?.syncedMetaIds)
          })
        }
      }
    }
  }
  useEffect(() => {
    checkIsInThis()
    const interval = setInterval(() => {
      check()
    }, 5000)
    return () => {
      clearInterval(interval)
    }
  }, [])
}

export default useCheckSyncInWhere
