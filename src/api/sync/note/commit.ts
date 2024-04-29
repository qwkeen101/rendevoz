import SyncAPI from '@/api/sync'

export default (id: number) => {
  SyncAPI.commitSyncOp({
    noteUpdateIds: [id]
  })
}
