import KeyvalueStore, { IYoutubeData } from '@/api/stores/keyvalue.store'
import { delay } from '@/utils'
import YoutubeServices from '@/core/components/feed/youtube/YoutubeServices'
import toast from 'react-hot-toast'

const PresetTopics = ['News', 'Study', 'Travel', 'Science', 'Entertainment', 'Gaming', 'Sports', 'Music']

const defaultYoutubeData: IYoutubeData = {
  dashboard: {
    activeTopic: 'News',
    topicToChannels: Object.fromEntries(
      PresetTopics.map(i => [
        i,
        {
          key: i,
          items: []
        }
      ])
    )
  }
}

const useYoutubeData = () => {
  return KeyvalueStore.useValue('youtubeData') || defaultYoutubeData
}
const addToHistory = (videoAppId: number) => {
  updateData(curr => ({
    ...curr,
    history: [
      { id: videoAppId, date: Date.now() },
      ...(curr.history?.filter(i => i.id !== videoAppId) || [])
    ]
  }))
}

const getData = () => {
  return KeyvalueStore.getOne('youtubeData') || defaultYoutubeData
}
const updateData = async (updater: (curr: IYoutubeData) => IYoutubeData) => {
  const curr = getData()
  await KeyvalueStore.updateOne('youtubeData', updater(curr))
}

const fetchDashboardTopicChannels = async (topic: string) => {
  try {
    const channels = await YoutubeServices.search(topic, {
      type: ['channel']
    })
    updateData(curr => ({
      ...curr,
      dashboard: {
        ...curr.dashboard,
        topicToChannels: {
          ...curr.dashboard.topicToChannels,
          [topic]: {
            key: topic,
            items: channels?.items
          }
        }
      }
    }))
  } catch (e) {
    toast.error('Failed to get channels!')
  }
}
useYoutubeData.getData = getData
useYoutubeData.updateData = updateData
useYoutubeData.fetchDashboardTopicChannels = fetchDashboardTopicChannels
useYoutubeData.addToHistory = addToHistory
export default useYoutubeData as typeof useYoutubeData & {
  getData: typeof getData
  updateData: typeof updateData
  fetchDashboardTopicChannels: typeof fetchDashboardTopicChannels
  addToHistory: typeof addToHistory
}
