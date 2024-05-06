import SyncAPI from '@/api/sync/index'
import { getSetting } from '@/core'

export default async function autoSync() {
  try {
    const setting = getSetting()
    if (setting.sync.enableSync && setting.sync.conflictResolved && setting.sync.enableAutoSync) {
      await SyncAPI.pull()
    }
  } catch (e) {
    console.error(e)
  } finally {
    // auto sync after 3 seconds
    setTimeout(() => autoSync(), 3 * 1000)
  }
}
