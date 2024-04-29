import SyncAPI from '@/api/sync/index'
import { importRendevozDb } from '@/utils'

export default async () => {
  const client = SyncAPI.cloudClient()
  if (client) {
    const file = await client.getFile('all-data')
    if (file) {
      const ds = new DecompressionStream('gzip')
      const stream = new Blob([file]).stream().pipeThrough(ds)
      const data = await new Response(stream).blob()
      await importRendevozDb(data)
    }
  }
}
