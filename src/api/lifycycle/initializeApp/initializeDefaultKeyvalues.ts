import { CurrentKeyValues, ISidebarConfig } from '@/api/stores/keyvalue.store'
import { useDb } from '@/hooks'

export const DEFAULT_SIDEBAR_CONFIG: ISidebarConfig = {
  navs: [
    {
      key: 'search',
      visible: true
    },
    {
      key: 'home',
      visible: true
    },
    {
      key: 'recycleBin',
      visible: true
    },
    {
      key: 'settings',
      visible: true
    }
  ],
  widgets: [
    {
      key: 'workspaces',
      visible: true
    },
    {
      key: 'folders',
      visible: true
    }
  ]
}
export default async () => {
  const defaultKeyvalues: Partial<CurrentKeyValues> = {
    searchQueryHistory: {},
    baiduAccessToken: localStorage.getItem('bda') ?? undefined,
    sidebarConfig: DEFAULT_SIDEBAR_CONFIG
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
