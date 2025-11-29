import KeyvalueStore from '@/api/stores/keyvalue.store'
import { refreshValueFromDB } from '@/api/stores/object/object.store'
import { MetaStore, CollectionStore } from '@/api/stores/index'

export default (db: 'keypairs' | 'objects' | 'metaObjects' | 'metaLinks', key: string | number) => {
  switch (db) {
    case 'keypairs': {
      KeyvalueStore.freshOne(key)
      break
    }
    case 'objects': {
      refreshValueFromDB(key)
      break
    }
    case 'metaObjects': {
      MetaStore.refreshFromDB('object', key)
      break
    }
    case 'metaLinks': {
      MetaStore.refreshFromDB('link', key)
      break
    }
  }
}
