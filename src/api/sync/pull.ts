import S3Sync from '@/api/sync/methods/s3'
import { IFileTransaction, ISyncOperation } from '@/api/sync/db/types'
import SyncAPI from '@/api/sync/index'
import { syncDB } from '@/utils'
import FileSystem from '@/api/fileSystem'
import { globalStore } from '@/api/stores'
import { strFromU8, decompressSync, decompress } from 'fflate'

export default async () => {
  const client = SyncAPI.cloudClient()
  if (client) {
    const lastSynced = await syncDB.table('state').get('lastSynced')
    const all = await client.listFolder('commits', lastSynced ? `commits/${lastSynced}` : undefined)
    globalStore.set(S3Sync.stateAtom, { ...globalStore.get(S3Sync.stateAtom), lastSynced: Date.now() })
    if (all) {
      const deviceId = await FileSystem.fs.getMachineId()
      const data = (
        await Promise.all(
          all.map(async k => {
            const buffer = await client.getFileAsBuffer(k.key)
            if (buffer) {
              return await new Promise<ISyncOperation>(res => {
                decompress(new Uint8Array(buffer), (err, data) => {
                  res(JSON.parse(strFromU8(data)))
                })
              })
            }
          })
        )
      ).filter(i => i && i.deviceId !== deviceId) as ISyncOperation[]
      // reverse here
      // const now = Date.now()
      // const needDelete = all.filter(i => !i.LastModified || now - i.LastModified.getTime() > 10 * 1000)
      // if (needDelete.length) {
      //   S3Sync.deleteFile(
      //     needDelete.map(i => i.Key),
      //     setting
      //   )
      // }
      console.log(data)
      const dbTransactions = data
        .map(i => i.databaseTranscations?.map(t => ({ ...t, timestamp: i.timestamp })))
        .flat()
        .reverse()
      const fileTransactions = data
        .map(i => i.fileTransactions)
        .flat()
        .filter(i => i) as IFileTransaction[]
      const noteIds = data
        .map(i => i.noteUpdateIds)
        .flat()
        .filter(i => i) as number[]
      if (fileTransactions.length) {
        await SyncAPI.file.pull(fileTransactions)
      }
      if (dbTransactions?.length) {
        SyncAPI.database.pull(dbTransactions)
      }
      if (noteIds.length) {
        SyncAPI.note.pull(Array.from(new Set(noteIds).values()))
      }
      syncDB.table('state').put(Date.now(), 'lastSynced')
    }
  }
}
