import { GroupStore } from '@/api/stores'
import createObjectStore from '@/api/stores/object/object.store'

export default () =>
  createObjectStore('group', {
    beforeAddProcess: async o => {
      const initialized = GroupStore.initializeGroup()
      Object.assign(o, initialized, o)
      return true
    }
  })
