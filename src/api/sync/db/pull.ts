// pull remote transactions and replace local
import { syncDB } from '@/utils'
import { IDBTransaction } from '@/api/sync/db/types'
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
    if ('value' in t && typeof t.value === 'object') {
      if ('id' in t.value) {
        if (dbKeys.has(t.value.id)) return
        dbKeys.add(t.value.id)
        finalDbTransactions.push(t)
      } else {
        finalDbTransactions.push(t)
      }
    }
  })
  console.log(finalDbTransactions)
  const modifyTable = syncDB.table('modify')
  finalDbTransactions.forEach(async t => {
    const key = (t.key || t.value?.id) as string | number | undefined
    if (key) {
      const db = useDb(t.database)
      if (t.type === 'delete') {
        needSkipKeys.add(key)
        db.delete(key)
      } else {
        if (shouldProcessLabels(t.value)) {
          if (await processLabelTrans(t, finalDbTransactions)) {
            return
          }
        }
        const localModifyTime = await modifyTable.get(key)
        if (localModifyTime && localModifyTime > t.timestamp) {
          return
        } else {
          needSkipKeys.add(key)
          await db.put(t.value, key)
          // await modifyTable.put(t.timestamp, key)
          refreshLocalFromDB(t.database, key)
        }
      }
    }
  })
}

const shouldProcessLabels = (value: any) => {
  if (typeof value === 'object') {
    if ('labels' in value && value.labels && Array.isArray(value.labels)) {
      return true
    }
  }
  return false
}
// 避免视频或者音频标注播放时bug，比如两边都在播放，并都做了标注，但是并没有同步过去的情况
const processLabelTrans = async (trans: IDBTransaction, allTrans: IDBTransaction[]) => {
  if (trans.type === 'put') {
    const key = trans.value?.id
    const value = trans.value
    if (!key || !value) {
      return
    }
    const db = useDb(trans.database)
    const localLabels = (await db.get(key))?.labels as number[] | undefined
    if (!localLabels) {
      return
    }
    const remoteLabels = value.labels as number[]
    console.log(remoteLabels, localLabels)
    const localLabelIdSet = new Set(localLabels)
    // label not changed, return here
    if (remoteLabels.length === localLabelIdSet.size && remoteLabels.every(i => localLabelIdSet.has(i))) {
      return
    }
    // delete tran
    allTrans.forEach(t => {
      if (t.type === 'delete' && typeof t.key === 'number' && localLabelIdSet.has(t.key)) {
        localLabelIdSet.delete(t.key)
      }
    })
    const finalLabelIdSet = new Set([...remoteLabels, ...Array.from(localLabelIdSet.values())])
    const finalLabels = Array.from(finalLabelIdSet.values())
    needSkipKeys.add(key)
    await db.put({ ...value, labels: finalLabels }, key)
    // await modifyTable.put(t.timestamp, key)
    refreshLocalFromDB(trans.database, key)
    return true
  }
}
