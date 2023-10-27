import useFeedState from '@/core/feed/hooks/useFeedState'
import { ObjectStore } from '@/stores'
import Video from '@/core/media/wrappers/Video'
import { Content } from '@/components'
import { Colors } from '@/consts'
import KeyvalueStore from '@/stores/keyvalue.store'

export default () => {
  const [feedState] = useFeedState()
  const mode = KeyvalueStore.useValue('feedOpenMode')
  const currentFeedItem = ObjectStore('feed').useValue(feedState.currentFocusedFeedItemId)
  if (currentFeedItem && !currentFeedItem.lastRead) {
    ObjectStore('feed').updateOne({ id: currentFeedItem.id, lastRead: Date.now() })
  }

  if (currentFeedItem) {
    return (
      <Content fullWidth fullHeight style={{ borderLeft: mode === 'rightBar' ? `1px solid ${Colors.Background.Border}` : undefined }}>
        <Video
          mediaState={{
            url: currentFeedItem.link,
            name: currentFeedItem.title,
            description: currentFeedItem.description,
            thumbnail: currentFeedItem.image
          }}
        />
      </Content>
    )
  }
}
