// commit
import { IDBTransaction, ISyncOperation } from '@/api/sync/db/types'
import { debounce } from 'lodash'
import FileSystem from '@/api/fileSystem'
import SyncAPI from '@/api/sync/index'
import { syncDB } from '@/utils'
import exportData from '@/api/common/exportData'
import { compressSync, strToU8 } from 'fflate'
import { getSetting } from '@/core'
let cache: Omit<ISyncOperation, 'timestamp' | 'deviceId'> = {
  databaseTranscations: [],
  fileTransactions: [],
  noteUpdateIds: []
}
export default async (operation: Partial<ISyncOperation>) => {
  cache.databaseTranscations = [...(cache.databaseTranscations || []), ...(operation.databaseTranscations || [])]
  cache.fileTransactions = [...(cache.fileTransactions || []), ...(operation.fileTransactions || [])]
  cache.noteUpdateIds = [...(cache.noteUpdateIds || []), ...(operation.noteUpdateIds || [])]
  const setting = getSetting()
  if (setting.sync.enableSync && setting.sync.conflictResolved && setting.sync.enableAutoSync) {
    debounceUpload()
  }
}

export const commitManually = async () => {
  const cloudClient = SyncAPI.cloudClient()
  if (cloudClient) {
    let cloned = structuredClone(cache)
    cache = {
      databaseTranscations: [],
      fileTransactions: [],
      noteUpdateIds: []
    }
    const lastUpload = await syncDB.table('state').get('lastUploaded')
    // upload files modified after last upload
    syncDB.table('state').put(Date.now(), 'lastUploaded')
    removeRepeatDBTransactions(cloned)
    removeRepeatNoteIds(cloned)
    if (!cloned.noteUpdateIds?.length) {
      delete cloned.noteUpdateIds
    }
    if (!cloned.databaseTranscations?.length) {
      delete cloned.databaseTranscations
    }
    if (!lastUpload) {
      await SyncAPI.file.syncLocalFiles()
    } else {
      const changedFiles = await SyncAPI.file.uploadModifiedLocalFiles(lastUpload)
      if (changedFiles) {
        cloned.fileTransactions = changedFiles.map(i => ({ type: 'put', name: i }))
      }
    }
    if (!cloned.noteUpdateIds?.length && !cloned.fileTransactions?.length && !cloned.databaseTranscations?.length) {
      return
    }
    cloudClient.uploadData(
      `commits/${Date.now()}`,
      new Blob([compressSync(strToU8(JSON.stringify({ ...cloned, timestamp: Date.now(), deviceId: await FileSystem.fs.getMachineId() })))])
    )
    const data = await exportData()
    cloudClient.uploadData('all-data.zip', data)
  }
}
const debounceUpload = debounce(commitManually, 2000, { maxWait: 5000 })
const removeRepeatNoteIds = (c: typeof cache) => {
  c.noteUpdateIds = Array.from(new Set(c.noteUpdateIds).values())
}
const removeRepeatDBTransactions = (c: typeof cache) => {
  const forbidId = new Set<string | number>(['sidebarState'])
  const alreadyExistId = new Set<string | number>()
  const reversed = c.databaseTranscations?.reverse() || []
  const finalOps: IDBTransaction[] = []
  // remove same key data, reverse here, because latest is at last of commits
  reversed.forEach(i => {
    if (i.key) {
      if (alreadyExistId.has(i.key) || forbidId.has(i.key)) return
      alreadyExistId.add(i.key)
      finalOps.push(i)
      return
    }
    if ('value' in i) {
      if ('id' in i.value) {
        if (alreadyExistId.has(i.value.id) || forbidId.has(i.value.id)) return
        alreadyExistId.add(i.value.id)
        finalOps.push(i)
      } else {
        finalOps.push(i)
      }
    }
  })
  c.databaseTranscations = finalOps
}
