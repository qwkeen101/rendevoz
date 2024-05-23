import { CollectionStore, MetaStore } from '@/api/stores/index'
import { removeFromCache } from '@/api/stores/object/object.store'
import keyvalueStore from '@/api/stores/keyvalue.store'

export default (db: 'keypairs' | 'objects' | 'metaObjects' | 'metaLinks' | 'collections', key: string | number) => {
  switch (db) {
    case 'metaObjects':
      MetaStore.removeFromCache('object', key)
      break
    case 'metaLinks':
      MetaStore.removeFromCache('link', key)
      break
    case 'objects':
      removeFromCache(key)
      break
    case 'collections':
      CollectionStore.removeFromCache(key)
      break
    case 'keypairs':
      keyvalueStore.removeFromCache(key)
      break
  }
}
