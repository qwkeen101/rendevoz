import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import GetDefaultPodcastCountry from '@/core/components/podcast/utils/getDefaultPodcastCountry'

export default () => {
  const data = usePodcastData.getData()
  if (data.country) {
    return data.country
  }
  return GetDefaultPodcastCountry()
}
