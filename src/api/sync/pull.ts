import S3Sync from '@/api/sync/methods/s3'
import { ISyncOperation } from '@/api/sync/db/types'
import SyncAPI from '@/api/sync/index'
import { syncDB } from '@/utils'
import FileSystem from '@/api/fileSystem'
import { globalStore } from '@/api/stores'

export default async () => {
  const client = SyncAPI.cloudClient()
  if (client) {
    const lastSynced = await syncDB.table('state').get('lastSynced')
    const all = await client.listFolder('commits', lastSynced ? `commits/${lastSynced}` : undefined)
    syncDB.table('state').put(Date.now(), 'lastSynced')
    globalStore.set(S3Sync.stateAtom, { ...globalStore.get(S3Sync.stateAtom), lastSynced: Date.now() })
    if (all) {
      const deviceId = await FileSystem.fs.getMachineId()
      const data = (
        (await Promise.all(all.map(async k => await client.getFile(k.key)))).filter(i => i).map(i => JSON.parse(i)) as ISyncOperation[]
      ).filter(i => i.deviceId !== deviceId)
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
      if (dbTransactions?.length) {
        SyncAPI.database.pull(dbTransactions)
      }
    }
  }
}
