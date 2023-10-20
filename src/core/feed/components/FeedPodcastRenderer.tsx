import useFeedState from '@/core/feed/hooks/useFeedState'
import { ObjectStore } from '@/stores'
import { Content } from '@/components'
import { Colors } from '@/consts'
import Audio from '@/core/media/wrappers/Audio'

export default () => {
  const [feedState] = useFeedState()
  const currentFeedItem = ObjectStore('feed').useValue(feedState.currentFocusedFeedItemId)
  if (currentFeedItem && !currentFeedItem.lastRead) {
    ObjectStore('feed').updateOne({ id: currentFeedItem.id, lastRead: Date.now() })
  }
  if (currentFeedItem && currentFeedItem.enclosure) {
    return (
      <Content fullWidth fullHeight style={{ borderLeft: `1px solid ${Colors.Background.Border}` }}>
        <Audio
          mediaState={{
            name: currentFeedItem.title,
            url: currentFeedItem.enclosure.url,
            thumbnail: currentFeedItem.image,
            description: currentFeedItem.description
          }}
        />
      </Content>
    )
  }
}
