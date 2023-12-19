import { IWhiteboardNode } from '~/typings'
import SyncedBlockEditor from '@/core/components/editor/SyncedBlockEditor'
import { useEffect } from 'react'
import { useFlow } from '@/core/components/whiteboard/StateHooks'
import { MetaStore, ObjectStore } from '@/api/stores'
import { pushNumberIntoUnrepeatableArray } from '@/utils'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'

const SyncedBlockNode = ({ node }: { node: IWhiteboardNode }) => {
  const flow = useFlow()
  const instance = useWhiteboardInstance()
  useEffect(() => {
    const check = async () => {
      const whiteboardId = flow.whiteboardId
      if (whiteboardId) {
        const syncMeta = await MetaStore.getMetaObjectById(node.metaObjectId)
        if (syncMeta?.objectId) {
          const whiteboardMeta = MetaStore.getMetaObjectByObjectId(whiteboardId)
          if (whiteboardMeta) {
            const syncBlock = await ObjectStore('syncedBlock').getOneById(syncMeta.objectId)
            if (!syncBlock?.syncedMetaIds.includes(whiteboardMeta.id)) {
              ObjectStore('syncedBlock').updateOne({
                id: syncBlock.id,
                syncedMetaIds: pushNumberIntoUnrepeatableArray(whiteboardMeta.id, syncBlock?.syncedMetaIds)
              })
            }
          }
        } else {
          if (!syncMeta) {
            instance.deleteNode?.(node.id)
          }
        }
      }
    }
    check()
  }, [])
  return (
    <div
      style={{
        minWidth: '100%',
        width: '30rem',
        height: '40rem',
        minHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        maxHeight: '100%',
        padding: '0px 0px 4px 8px'
      }}
    >
      <SyncedBlockEditor syncedBlockMetaId={node.metaObjectId} />
    </div>
  )
  return
}

export default SyncedBlockNode
