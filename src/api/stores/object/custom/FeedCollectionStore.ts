import KeyvalueStore from '@/api/stores/keyvalue.store'
import createObjectStore from '@/api/stores/object/object.store'

export default () => {
  return createObjectStore('feedCollection', {
    beforeAddProcess: async o => {
      if (!o.workspace) {
        const currWorkspace = KeyvalueStore.getOne('currentWorkspace')
        currWorkspace && (o.workspace = currWorkspace.id)
      }
    },
    afterGetAllProcess: all => {
      const currWorkspace = KeyvalueStore.getOne('currentWorkspace')
      if (currWorkspace) {
        return all.filter(i => !i.workspace || i.workspace === currWorkspace.id)
      }
      return all
    }
  })
}
