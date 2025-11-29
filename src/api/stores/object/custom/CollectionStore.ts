import createObjectStore from '@/api/stores/object/object.store'
import KeyvalueStore from '@/api/stores/keyvalue.store'
export default () => {
  return createObjectStore('collection', {
    beforeAddProcess: async o => {
      if (!o.workspace) {
        o.workspace = KeyvalueStore.getOne('currentWorkspace')?.id
      }
      if (!o.items) {
        o.items = []
      }
      return true
    }
  })
}
