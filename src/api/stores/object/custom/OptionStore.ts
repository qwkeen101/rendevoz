import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import createObjectStore from '@/api/stores/object/object.store'

export default () =>
  createObjectStore('metaPropSelectOption', {
    beforeAddProcess: async o => {
      if (o.parentPropName) {
        const map = globalStore.get(ObjectStore('metaPropSelectOption').objectMapAtom)
        const allOptions = MetaStore.getPropOptions()[o.parentPropName]
        o.order = Math.max(...Array.from(allOptions?.values() || []).map(i => map.get(i)?.order ?? -1)) + 1
      }
    }
  })
