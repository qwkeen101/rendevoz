import KeyvalueStore, { IPodcastData } from '@/api/stores/keyvalue.store'

const defaultData: IPodcastData = {
  recentlyViewedEpisodes: [],
  recentlyViewedPodcasts: [],
  followedEpisodes: [],
  followedPodcasts: [],
  playlist: {
    list: []
  },
  history: [],
  libraryCache: {}
}
const usePodcastData = () => {
  return KeyvalueStore.useValue('podcastData') || defaultData
}

const getData = () => {
  return KeyvalueStore.getOne('podcastData') || defaultData
}
const updateData = async (updater: (curr: IPodcastData) => IPodcastData) => {
  const curr = getData()
  await KeyvalueStore.updateOne('podcastData', updater(curr))
}

const mergePodcastData = async () => {
  const current = await KeyvalueStore.fetchOne('podcastData')
  if (current) {
    const merged = Object.assign({}, defaultData, current)
    await KeyvalueStore.updateOne('podcastData', merged)
  }
}
usePodcastData.getData = getData
usePodcastData.updateData = updateData
usePodcastData.mergePodcastData = mergePodcastData
export default usePodcastData as typeof usePodcastData & {
  getData: typeof getData
  updateData: typeof updateData
  mergePodcastData: typeof mergePodcastData
}
