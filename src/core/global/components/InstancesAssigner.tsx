import useAssignFeed from '@/core/components/feed/hooks/useAssignFeed'
import { useAssignPodcast } from '@/core/components/podcast/hooks/usePodcastInstance'
import useAssignYoutube from '@/core/components/youtube/hooks/useAssignYoutube'

export default () => {
  useAssignFeed()
  useAssignPodcast()
  useAssignYoutube()
  return null
}
