import SyncAPI from '@/api/sync/index'
import { getSetting } from '@/core'

export default async function autoSync() {
  const setting = getSetting()
  if (setting.sync.enableSync && setting.sync.conflictResolved && setting.sync.enableAutoSync) {
    await SyncAPI.pull()
  }
  // auto sync after 5 seconds
  setTimeout(() => autoSync(), 5 * 1000)
}