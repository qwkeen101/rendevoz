import createObjectStore from '@/api/stores/object/object.store'
import keyvalueStore from '@/api/stores/keyvalue.store'
export default () => {
  return createObjectStore('reviewFolder', {
    beforeAddProcess: async n => {
      if (!n.workspace) {
        n.workspace = keyvalueStore.getOne('currentWorkspace')?.id
      }
      if (!n.children) {
        n.children = []
      }
    }
  })
}
