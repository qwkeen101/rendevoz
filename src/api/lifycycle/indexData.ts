import { bulkRefreshValue } from '@/api/stores/object/object.store'
import { CollectionStore, MetaStore, ObjectStore } from '@/api/stores'
import { initializeSearch } from '@/api/textSearch/SearchHelper'

export default async (forceSearch = false) => {
  bulkRefreshValue()
  MetaStore.clearAtomData()
  CollectionStore.clearAtomData()
  await ObjectStore('metaProp').getAll()
  await ObjectStore('metaPropSelectOption').getAll()
  await ObjectStore('tag').getAll()
  await MetaStore.getAllMetaLinks()
  await MetaStore.getAllMetaObjects()
  await CollectionStore.getAllCollections()
  await initializeSearch(forceSearch)
}
