import { bulkRefreshValue } from '@/api/stores/object/object.store'
import { MetaStore, ObjectStore } from '@/api/stores'
import { initializeSearch } from '@/api/textSearch/SearchHelper'
import normalizeWhiteboards from '@/api/lifycycle/initializeApp/normalizeWhiteboards'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'

export default async (forceSearch = false) => {
  bulkRefreshValue()
  MetaStore.clearAtomData()
  await normalizeWhiteboards()
  await ObjectStore('collection').getAll()
  await ObjectStore('metaProp').getAll()
  await ObjectStore('metaPropSelectOption').getAll()
  await ObjectStore('tag').getAll()
  await usePodcastData.mergePodcastData()
  await MetaStore.getAllMetaLinks()
  await MetaStore.getAllMetaObjects()
  await initializeSearch(forceSearch)
  const episodeList = KeyvalueStore.getOne('podcastData')?.playlist
  if (episodeList?.list.length) {
    ObjectStore('episode').getMultipleByIds(episodeList.list)
  }
}
