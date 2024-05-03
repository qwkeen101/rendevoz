import { DBCoreMutateRequest } from 'dexie'
import { IDBTransaction } from '@/api/sync/db/types'
import { syncDB } from '@/utils'
import SyncAPI from '@/api/sync'
import GlobalStates from '@/api/global/states'

let opsToCommit: IDBTransaction[] = []

// update local modify timestamp, prevent remote replace local newer records
const updateLocalSyncTimestamp = (key: string | number) => {
  const db = syncDB.table('modify')
  db.put(Date.now(), key)
}
export const needSkipKeys = new Set<string | number>()
export default (op: DBCoreMutateRequest, dbName: string) => {
  const initialized = GlobalStates.getValue('initialized')
  if (!initialized) return
  if (op.type === 'delete') {
    op.keys.forEach(k => {
      if (needSkipKeys.has(k)) {
        needSkipKeys.delete(k)
        return
      }
      opsToCommit.push({
        type: 'delete',
        key: k,
        database: dbName
      })
    })
  }
  if (op.type === 'add' || op.type === 'put') {
    if (op.keys) {
      op.keys.forEach((k, idx) => {
        if (needSkipKeys.has(k)) {
          needSkipKeys.delete(k)
          return
        }
        const v = op.values[idx]
        if (v) {
          opsToCommit.push({
            type: 'put',
            value: v,
            key: k,
            database: dbName
          })
          updateLocalSyncTimestamp(k)
        }
      })
    } else {
      op.values.forEach(value => {
        if (needSkipKeys.has(value.id)) {
          needSkipKeys.delete(value.id)
          return
        }
        opsToCommit.push({
          type: 'put',
          value,
          database: dbName
        })
        if ('id' in value && value.id) {
          updateLocalSyncTimestamp(value.id)
        }
      })
    }
  }
  SyncAPI.commitSyncOp({
    databaseTranscations: opsToCommit
  })
  opsToCommit = []
}
