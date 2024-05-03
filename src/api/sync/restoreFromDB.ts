import SyncAPI from '@/api/sync/index'
import { importRendevozDb } from '@/utils'
import { unzip, strFromU8 } from 'fflate'
export default async () => {
  const client = SyncAPI.cloudClient()
  const error = 'Failed to load remote data!'
  if (client) {
    const file = await client.getFileAsBuffer('all-data.zip')
    if (file) {
      return await new Promise((res, rej) => {
        unzip(new Uint8Array(file), (err, f) => {
          if (err) rej(error)
          const u8 = f['all-data.json']
          if (u8) {
            const str = strFromU8(u8)
            importRendevozDb(new Blob([str], { type: 'application/json' }))
            res(null)
          }
          rej(error)
        })
      })
    }
  }
  throw 'Failed to initialize sync client!'
}
