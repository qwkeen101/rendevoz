import { globalStore, MetaStore } from '@/api/stores'
import { urlToIdMap } from '@/api/indexData/urlToId'
import createObjectStore from '@/api/stores/object/object.store'

export default () =>
  createObjectStore('webpage', {
    beforeAddMetaProcss: async obj => {
      if (obj.url) {
        const already = globalStore.get(urlToIdMap).get(obj.url)
        if (already) {
          const meta = MetaStore.getMetaObjectByObjectId(already)
          if (meta) {
            return meta
          }
        }
      }
    },
    beforeAddProcess: async o => {
      if (!('url' in o)) {
        o.url = ''
      }
    },
    afterAddMetaProcess: {
      onSuccess: async (obj, meta) => {
        if (obj.url) {
          if (!meta.name) {
            const result = await Global.utils.fetchDetails(obj.url)
            await MetaStore.updateMetaObject(
              { id: meta.id, coverImgSrc: result.image, name: result.title, description: result.description },
              {
                silent: true
              }
            )
          }
        }
      }
    }
  })
