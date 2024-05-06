import SyncAPI from '@/api/sync/index'
import { getSetting } from '@/core'

export default async function autoSync() {
  const setting = getSetting()
  if (setting.sync.enableSync && setting.sync.conflictResolved && setting.sync.enableAutoSync) {
    await SyncAPI.pull()
  }
  // auto sync after 3 seconds
  setTimeout(() => autoSync(), 3 * 1000)
}
