import SyncAPI from '@/api/sync/index'
import { importRendevozDb } from '@/utils'
import { unzip, strToU8, strFromU8 } from 'fflate'
export default async () => {
  const client = SyncAPI.cloudClient()
  if (client) {
    const file = await client.getFileAsBuffer('all-data.zip')
    if (file) {
      unzip(new Uint8Array(file), (err, f) => {
        const u8 = f['all-data.json']
        if (u8) {
          const str = JSON.parse(strFromU8(u8))
          importRendevozDb(new Blob([str], { type: 'application/json' }))
        }
      })
    }
  }
}
