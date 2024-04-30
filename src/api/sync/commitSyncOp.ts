// commit
import { IDBTransaction, ISyncOperation } from '@/api/sync/db/types'
import { debounce } from 'lodash'
import FileSystem from '@/api/fileSystem'
import S3Sync from '@/api/sync/methods/s3'
import SyncAPI from '@/api/sync/index'
import { syncDB } from '@/utils'
import exportData from '@/api/common/exportData'
import cloud from '@/components/custom/icons/Cloud'
import { compressSync, strToU8 } from 'fflate'
let cache: Omit<ISyncOperation, 'timestamp' | 'deviceId'> = {
  databaseTranscations: [],
  fileTransactions: [],
  noteUpdateIds: []
}
// commit to s3 default
export default async (operation: Partial<ISyncOperation>) => {
  cache.databaseTranscations = [...(cache.databaseTranscations || []), ...(operation.databaseTranscations || [])]
  cache.fileTransactions = [...(cache.fileTransactions || []), ...(operation.fileTransactions || [])]
  cache.noteUpdateIds = [...(cache.noteUpdateIds || []), ...(operation.noteUpdateIds || [])]
  debounceUpload()
}

const debounceUpload = debounce(async () => {
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
}, 2000)
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
