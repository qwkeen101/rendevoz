import SyncAPI from '@/api/sync/index'
import { importRendevozDb, syncDB } from '@/utils'
import { unzip, strFromU8 } from 'fflate'
export default async (checkModify = false) => {
  const client = SyncAPI.cloudClient()
  const error = 'Failed to load remote data!'
  if (client) {
    if (checkModify) {
      const remoteState = await client.statFile('all-data.zip')
      const lastUploaded = (await syncDB.table('state').get('lastDatabaseUploaded')) as number | undefined
      const localLastModified = (await syncDB.table('state').get('lastDatabaseModified')) as number | undefined
      if (lastUploaded) {
        if (!remoteState || !remoteState.lastModified || remoteState.lastModified < lastUploaded) {
          return
        }
      }
      if (localLastModified) {
        if (!remoteState || !remoteState.lastModified || remoteState.lastModified < localLastModified) {
          return
        }
      }
    }
    const file = await client.getFileAsBuffer('all-data.zip')
    if (file) {
      return await new Promise((res, rej) => {
        unzip(new Uint8Array(file), (err, f) => {
          if (err) rej(error)
          const u8 = f['all-data.json']
          if (u8) {
            const str = strFromU8(u8)
            importRendevozDb(new Blob([str], { type: 'application/json' }))
            syncDB.table('state').put(Date.now(), 'lastDatabaseModified')
            res(null)
          }
          rej(error)
        })
      })
    }
  }
  throw 'Failed to initialize sync client!'
}
