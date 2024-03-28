import KeyvalueStore from '@/api/stores/keyvalue.store'

export default () => {
  const workspace = KeyvalueStore.useValue('currentWorkspace')
  const cache = KeyvalueStore.useValue('moveToCache')?.[workspace?.id || 0]
  return cache
}
