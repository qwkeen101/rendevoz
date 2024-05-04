import { IFileTransaction, ISyncOperation } from '@/api/sync/db/types'
import SyncAPI from '@/api/sync/index'
import { syncDB } from '@/utils'
import FileSystem from '@/api/fileSystem'
import { globalStore } from '@/api/stores'
import { strFromU8, decompress } from 'fflate'
import { debounce } from 'lodash'
const debounceDeleteCommits = debounce(async () => {
  const lastSynced = await syncDB.table('state').get('lastSynced')
  if (lastSynced) {
    const commits = await SyncAPI.cloudClient()?.listFolder('commits')
    if (commits) {
      const date = new Date(lastSynced)
      date.setMinutes(date.getMinutes() - 5)
      const time = date.getTime()
      const needDeleteCommits = commits.filter(a => (a.lastModified ?? 0) < time)
      await Promise.all(needDeleteCommits.map(async c => SyncAPI.cloudClient()?.deleteFile(c.key)))
    }
  }
}, 60 * 1000)
export default async () => {
  const client = SyncAPI.cloudClient()
  if (client) {
    debounceDeleteCommits()
    const lastSynced = await syncDB.table('state').get('lastSynced')
    syncDB.table('state').put(Date.now(), 'lastSynced')
    const all = await client.listFolder('commits', lastSynced ? `commits/${lastSynced}` : undefined)
    globalStore.set(SyncAPI.stateAtom, { ...globalStore.get(SyncAPI.stateAtom), lastSynced: Date.now() })
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
    }
  }
}
