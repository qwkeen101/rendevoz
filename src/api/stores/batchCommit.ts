import { DBCoreMutateRequest } from 'dexie'
import { IDBTransaction } from '@/api/sync/db/types'

const opsToCommit: IDBTransaction[] = []
// commit every 3 seconds
const lastCommit: {
  current: undefined | number
} = {
  current: undefined
}
export default (op: DBCoreMutateRequest, dbName: string) => {
  return
  if (op.type === 'delete') {
    op.keys.forEach(k => {
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
        const v = op.values[idx]
        if (v) {
          opsToCommit.push({
            type: 'put',
            value: v,
            key: k,
            database: dbName
          })
        }
      })
    } else {
      op.values.forEach(value => {
        opsToCommit.push({
          type: 'put',
          value,
          database: dbName
        })
      })
    }
  }
}
