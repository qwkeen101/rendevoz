import { CurrentKeyValues } from '@/api/stores/keyvalue.store'
import { DefaultEditorSettings } from '@/api/lifycycle/initializeApp/initializeSettings'
import { useDb } from '@/hooks'

const defaultSidebarItems = ['home', 'database', 'feeds', 'search', 'graph', 'recycleBin', 'settings']
export default async () => {
  const defaultKeyvalues: Partial<CurrentKeyValues> = {
    searchHistory: [],
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
    baiduAccessToken: localStorage.getItem('bda') ?? undefined
  }
  const kvDb = useDb('keypairs')
  const all = kvDb.toCollection()
  const allKeys = new Set(await all.keys())
  await Promise.all(
    Object.keys(defaultKeyvalues).map(async key => {
      if (!allKeys.has(key)) {
        await kvDb.put(defaultKeyvalues[key], key)
      }
    })
  )
}
