import useFeedState from '@/core/feed/hooks/useFeedState'
import { ObjectStore } from '@/stores'
import { Content } from '@/components'
import { Colors } from '@/consts'
import Audio from '@/core/media/wrappers/Audio'
import KeyvalueStore from '@/stores/keyvalue.store'

export default () => {
  const [feedState] = useFeedState()
  const currentFeedItem = ObjectStore('feed').useValue(feedState.currentFocusedFeedItemId)
  const mode = KeyvalueStore.useValue('feedOpenMode')
  if (currentFeedItem && !currentFeedItem.lastRead) {
    ObjectStore('feed').updateOne({ id: currentFeedItem.id, lastRead: Date.now() })
  }
  if (currentFeedItem && currentFeedItem.enclosure) {
    return (
      <Content fullWidth fullHeight style={{ borderLeft: mode === 'rightBar' ? `1px solid ${Colors.Background.Border}` : undefined }}>
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
