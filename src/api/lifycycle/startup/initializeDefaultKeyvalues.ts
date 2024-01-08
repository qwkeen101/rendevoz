import { CurrentKeyValues } from '@/api/stores/keyvalue.store'
import { DefaultEditorSettings } from '@/api/lifycycle/startup/initializeSettings'
import { useDb } from '@/hooks'

const defaultSidebarItems = ['home', 'database', 'collections', 'feeds', 'search', 'graph', 'settings']
export default async () => {
  const defaultKeyvalues: Partial<CurrentKeyValues> = {
    searchHistory: [],
    currentWorkspace: 'default',
    homeDisplayMode: 'table',
    editorSettings: DefaultEditorSettings,
    webpageShowOriginal: false,
    rightBarItems: [],
    leftBarItems: defaultSidebarItems,
    feedCardView: 'title',
    feedOpenMode: 'rightBar',
    feedReadRule: 'all',
    feedReadIds: [],
    feedReadLaterIds: [],
    feedRecentlyReadIds: [],
    homeGalleryRows: 1
  }
  const kvDb = useDb('keypairs')
  const all = await kvDb.toCollection()
  const allKeys = new Set(await all.keys())
  await Promise.all(
    Object.keys(defaultKeyvalues).map(async key => {
      if (!allKeys.has(key)) {
        await kvDb.put(defaultKeyvalues[key], key)
      }
    })
  )
}
