import KeyvalueStore, { IPodcastData } from '@/api/stores/keyvalue.store'

const defaultData: IPodcastData = {
  recentlyViewedEpisodes: [],
  recentlyViewedPodcasts: [],
  followedEpisodes: [],
  followedPodcasts: [],
  playlist: {
    list: []
  }
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
usePodcastData.getData = getData
usePodcastData.updateData = updateData
export default usePodcastData as typeof usePodcastData & {
  getData: typeof getData
  updateData: typeof updateData
}
