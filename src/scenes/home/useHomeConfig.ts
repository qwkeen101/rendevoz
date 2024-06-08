import KeyvalueStore, { IHomeConfig } from '@/api/stores/keyvalue.store'

const defaultHomeConfig: IHomeConfig = {
  mode: 'list',
  list: {
    visibleType: 'all',
    sortMode: 'viewDesc'
  },
  gallery: {
    items: [
      {
        name: 'recentlyViewed',
        visible: true
      },
      {
        name: 'recentlyCreated',
        visible: true
      },
      {
        name: 'pinned',
        visible: true
      }
    ],
    rowsPerItem: 1
  }
}

const useHomeConfig = () => {
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')?.id ?? 0
  const config = KeyvalueStore.useValue(`home_config_${currentWorkspace}`) ?? defaultHomeConfig
  return config
}
const updateHomeConfig = (updater: (curr: IHomeConfig) => IHomeConfig) => {
  const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
  if (currentWorkspace) {
    const current = KeyvalueStore.getOne(`home_config_${currentWorkspace.id}`) ?? defaultHomeConfig
    const next = updater(current)
    KeyvalueStore.updateOne(`home_config_${currentWorkspace.id}`, next)
  }
}
useHomeConfig.defaultConfig = defaultHomeConfig
useHomeConfig.update = updateHomeConfig
export default useHomeConfig as typeof useHomeConfig & {
  defaultConfig: typeof defaultHomeConfig
  update: typeof updateHomeConfig
}
