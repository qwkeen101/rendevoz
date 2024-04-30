import { IFileTransaction } from '@/api/sync/db/types'
import SyncAPI from '@/api/sync'

export default (transactions: IFileTransaction[]) => {
  const keys = new Set<string>(transactions.filter(i => i.type === 'put').map(i => i.name))
  if (keys.size) {
    const arr = Array.from(keys.values())
    const client = SyncAPI.cloudClient()
    if (client) {
      client.downloadFile(arr)
    }
  }
}
