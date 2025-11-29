import createObjectStore from '@/api/stores/object/object.store'
import { ObjectStore } from '@/api/stores'

export default () => {
  return createObjectStore('chat', {
    onSearch: async o => {
      const content = (await ObjectStore('message').getMultipleByIds(o.messages, false))
        .map(i => i.content)
        .filter(i => typeof i === 'string')
        .join(' ')
      return content
    },
    afterUpdateProcess: {
      triggerSearch: true
    }
  })
}
