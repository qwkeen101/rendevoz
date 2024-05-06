import KeyvalueStore, { SidebarDatabaseCache } from '@/api/stores/keyvalue.store'
import { useMemoizedFn } from '@/hooks'

export default (): [SidebarDatabaseCache, (s: (s: SidebarDatabaseCache) => SidebarDatabaseCache) => void] => {
  const currWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const cache = KeyvalueStore.useValue(`sidebarDatabaseCache_${currWorkspace?.id ?? 0}`) || {
    filterVisible: false,
    searchInput: '',
    searchVisible: false,
    viewMode: 'thumbnail',
    filter: {
      groupType: 'and',
      filterType: 'group',
      rules: []
    }
  }
  const updateState = useMemoizedFn((s: typeof cache | ((s: typeof cache) => typeof cache)) => {
    if (!currWorkspace) return
    if (typeof s === 'function') {
      KeyvalueStore.updateOne(`sidebarDatabaseCache_${currWorkspace.id}`, s(cache))
    } else {
      KeyvalueStore.updateOne(`sidebarDatabaseCache_${currWorkspace.id}`, cache)
    }
  })
  return [cache, updateState]
}
