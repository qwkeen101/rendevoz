import KeyvalueStore, { IHomeConfig } from '@/api/stores/keyvalue.store'

const defaultHomeConfig: IHomeConfig = {
  mode: 'list',
  listSort: 'nameAsc',
  gallerySort: 'nameAsc'
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
const getValue = () => {
  const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
  const current = KeyvalueStore.getOne(`home_config_${currentWorkspace?.id || 0}`) ?? defaultHomeConfig
  return current
}
useHomeConfig.defaultConfig = defaultHomeConfig
useHomeConfig.update = updateHomeConfig
useHomeConfig.getValue = getValue
export default useHomeConfig as typeof useHomeConfig & {
  defaultConfig: typeof defaultHomeConfig
  update: typeof updateHomeConfig
  getValue: typeof getValue
}
