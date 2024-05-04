import KeyvalueStore from '@/api/stores/keyvalue.store'
import _ from 'lodash'
import { DEFAULT_BACKGROUND_COLORS } from '@/components/picker/colorPicker'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { tagToMetaObjectIdsMapAtom } from '@/api/stores/meta/meta.store'
import createObjectStore from '@/api/stores/object/object.store'

export default () =>
  createObjectStore('tag', {
    afterGetAllProcess: all => {
      const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
      if (currentWorkspace) {
        console.log(all.filter(i => !i.workspace || currentWorkspace.id === i.workspace))
        return all.filter(i => !i.workspace || currentWorkspace.id === i.workspace)
      }
      return all
    },
    beforeAddProcess: async o => {
      if (!o.color) {
        o.color = _.sample(DEFAULT_BACKGROUND_COLORS)
      }
      if (!o.workspace) {
        const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
        if (currentWorkspace) {
          o.workspace = currentWorkspace.id
        }
      }
      const allOrders = Array.from(globalStore.get(ObjectStore('tag').objectMapAtom).values()).map(i => i.order ?? -1)
      o.order = Math.max(...allOrders) + 1
      return true
    },
    transformData: obj => {
      const currWorkspace = KeyvalueStore.getOne('currentWorkspace')
      if (currWorkspace) {
        if (!obj.workspace || obj.workspace === currWorkspace.id) {
          return obj
        }
        return
      }
      return obj
    },
    beforeDeleteProcess: async id => {
      const tag = await ObjectStore('tag').getOneById(id)
      if (tag && tag.name) {
        globalStore
          .get(tagToMetaObjectIdsMapAtom)
          ?.get(tag.name)
          ?.forEach(async metaId => {
            const metaObject = await MetaStore.getMetaObjectById(metaId)
            MetaStore.updateMetaObject(
              {
                id: metaId,
                tags: metaObject?.tags?.filter(i => i !== tag.name)
              },
              { silent: true }
            )
          })
      }
    }
  })
