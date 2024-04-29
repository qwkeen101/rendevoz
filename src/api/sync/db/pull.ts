// pull remote transactions and replace local
import { syncDB } from '@/utils'
import S3Sync from '@/api/sync/methods/s3'
import { IDBTransaction, ISyncOperation } from '@/api/sync/db/types'
import { useDb } from '@/hooks'
import { needSkipKeys } from '@/api/sync/db/commitDbActions'
import refreshLocalFromDB from '@/api/stores/refreshLocalFromDB'

export default (dbTransactions: IDBTransaction[]) => {
  const dbKeys = new Set<string | number>()
  const finalDbTransactions: (IDBTransaction & { timestamp: number })[] = []
  dbTransactions.forEach(t => {
    if (t.key) {
      if (dbKeys.has(t.key)) return
      dbKeys.add(t.key)
      finalDbTransactions.push(t)
    }
    if ('value' in t) {
      if ('id' in t.value) {
        if (dbKeys.has(t.value.id)) return
        dbKeys.add(t.value.id)
        finalDbTransactions.push(t)
      } else {
        finalDbTransactions.push(t)
      }
    }
  })
  const modifyTable = syncDB.table('modify')
  finalDbTransactions.forEach(async t => {
    const key = (t.key || t.value?.id) as string | number | undefined
    if (key) {
      const db = useDb(t.database)
      if (t.type === 'delete') {
        needSkipKeys.add(key)
        db.delete(key)
      } else {
        const localModifyTime = await modifyTable.get(key)
        if (localModifyTime && localModifyTime > t.timestamp) {
          return
        } else {
          needSkipKeys.add(key)
          await db.put(t.value, key)
          refreshLocalFromDB(t.database, key)
        }
      }
    }
  })
}