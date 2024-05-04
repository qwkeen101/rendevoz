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
    const lastUpload = await syncDB.table('state').get('lastUploaded')
    // upload files modified after last upload
    syncDB.table('state').put(Date.now(), 'lastUploaded')
    removeRepeatDBTransactions()
    removeRepeatNoteIds()
    if (!cache.noteUpdateIds?.length) {
      delete cache.noteUpdateIds
    }
    if (!cache.databaseTranscations?.length) {
      delete cache.databaseTranscations
    }
    if (!cache.databaseTranscations && !cache.noteUpdateIds) {
      cache = {
        databaseTranscations: [],
        fileTransactions: [],
        noteUpdateIds: []
      }
      return
    }

    if (!lastUpload) {
      await SyncAPI.file.syncLocalFiles()
    } else {
      const changedFiles = await SyncAPI.file.uploadModifiedLocalFiles(lastUpload)
      if (changedFiles) {
        cache.fileTransactions = changedFiles.map(i => ({ type: 'put', name: i }))
      }
    }
    console.log(cache)
    cloudClient.uploadData(
      `commits/${Date.now()}`,
      new Blob([compressSync(strToU8(JSON.stringify({ ...cache, timestamp: Date.now(), deviceId: await FileSystem.fs.getMachineId() })))])
    )
    const data = await exportData()
    cloudClient.uploadData('all-data.zip', data)
    cache = {
      databaseTranscations: [],
      fileTransactions: [],
      noteUpdateIds: []
    }
  }
}
const debounceUpload = debounce(commitManually, 2000, { maxWait: 4000 })
const removeRepeatNoteIds = () => {
  cache.noteUpdateIds = Array.from(new Set(cache.noteUpdateIds).values())
}
const removeRepeatDBTransactions = () => {
  const forbidId = new Set<string | number>(['sidebarState'])
  const alreadyExistId = new Set<string | number>()
  const reversed = cache.databaseTranscations?.reverse() || []
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
  cache.databaseTranscations = finalOps
}
