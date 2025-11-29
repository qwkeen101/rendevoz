import createObjectStore from '@/api/stores/object/object.store'

export default () => {
  return createObjectStore('code', {
    onSearch: async o => {
      return o.content
    },
    afterUpdateProcess: {
      triggerSearch: true
    }
  })
}
