import createObjectStore from '@/api/stores/object/object.store'
import { ObjectStore } from '@/api/stores'
export default () => {
  return createObjectStore('message', {
    onSearch: async o => {
      return typeof o.content === 'string' ? o.content : ''
    },
    afterUpdateProcess: {
      onSuccess: o => {
        if (o.parentObjectId) {
          ObjectStore('chat').triggerSearch?.(o.parentObjectId)
        }
      }
    }
  })
}
