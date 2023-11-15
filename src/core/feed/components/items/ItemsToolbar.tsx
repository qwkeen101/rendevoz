import { FeedItem } from '@/core/feed/types'
import { Content, Icon } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { DateFormat } from '@/utils'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import useFeedIsMeta from '@/core/feed/hooks/useFeedIsMeta'
import useFeedIsRead from '@/core/feed/hooks/useFeedIsRead'
import unreadItem from '@/core/feed/utils/service/unreadItem'
import useFeedState from '@/core/feed/hooks/useFeedState'
import readItem from '@/core/feed/utils/service/readItem'
import addFeedAsMeta from '@/core/feed/utils/service/addFeedAsMeta'

const ItemsToolbar = ({ itemId }: { itemId: number }) => {
  const item = ObjectStore('feed').useValue(itemId)
  const currentReadLater = KeyvalueStore.useValue('feedReadLaterIds') || []
  const isReadLater = currentReadLater?.includes(itemId)
  const currentRead = KeyvalueStore.useValue('feedReadIds') || []
  const currentCollectionId = useFeedState()[0].currentCollectionId
  const { isMeta, metaId } = useFeedIsMeta(itemId)
  const isRead = useFeedIsRead(itemId)
  if (!item) return null
  return (
    <Content gap={10} flex justifyContent={'space-between'} style={{ color: Colors.Font.Transparent, fontSize: 13 }}>
      {item.date && DateFormat.formatDistanceToNowStrict(item.date)}
      <Content flex gap={6}>
        <Icon
          className={ClassName.flatButton(4, '3px')}
          name={'park-star'}
          onClick={e => {
            e.stopPropagation()
            if (isReadLater) {
              KeyvalueStore.updateOne(
                'feedReadLaterIds',
                currentReadLater.filter(i => i !== itemId)
              )
            } else {
              KeyvalueStore.updateOne('feedReadLaterIds', [itemId, ...currentReadLater])
            }
          }}
          theme={isReadLater ? 'filled' : undefined}
          style={{
            color: isReadLater ? Colors.Emphasis.Emphasis : undefined
          }}
        />
        <Icon
          style={{
            color: isRead ? Colors.Common.SelectColor : undefined
          }}
          onClick={e => {
            e.stopPropagation()
            if (isRead) {
              unreadItem(itemId, currentCollectionId)
            } else {
              readItem(itemId, currentCollectionId)
            }
          }}
          className={ClassName.flatButton(4, '3px')}
          name={isRead ? 'park-preview-open' : 'park-preview-close'}
        />
        <Icon
          style={{
            color: metaId ? Colors.Common.SelectColor : undefined
          }}
          onClick={e => {
            e.stopPropagation()
            if (metaId) {
              MetaStore.deleteMetaObject(metaId)
            } else {
              addFeedAsMeta(itemId)
            }
          }}
          className={ClassName.flatButton(4, '3px')}
          name={'park-share-one'}
        />
      </Content>
    </Content>
  )
}

export default ItemsToolbar
