import { FeedItem } from '@/core/components/feed/types'
import { Button, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { DateFormat } from '@/utils'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import useFeedIsMeta from '@/core/components/feed/hooks/useFeedIsMeta'
import useFeedIsRead from '@/core/components/feed/hooks/useFeedIsRead'
import unreadItem from '@/core/components/feed/utils/service/unreadItem'
import useFeedState from '@/core/components/feed/hooks/useFeedState'
import readItem from '@/core/components/feed/utils/service/readItem'
import addFeedAsMeta from '@/core/components/feed/utils/service/addFeedAsMeta'
import { useTranslation } from 'react-i18next'
import { GlobalInstance } from '@/hooks'

const ItemsToolbar = ({ itemId }: { itemId: number }) => {
  const item = ObjectStore('feed').useValue(itemId)
  const currentReadLater = KeyvalueStore.useValue('feedReadLaterIds') || []
  const isReadLater = currentReadLater?.includes(itemId)
  const currentRead = KeyvalueStore.useValue('feedReadIds') || []
  const currentCollectionId = useFeedState()[0].currentCollectionId
  const { isMeta, metaId } = useFeedIsMeta(itemId)
  const { t } = useTranslation()
  const isRead = useFeedIsRead(itemId)
  if (!item) return null
  return (
    <Content gap={10} flex justifyContent={'space-between'} style={{ color: Colors.Font.Transparent, fontSize: 13 }}>
      {item.date && DateFormat.formatDistanceToNowStrict(item.date)}
      <Content flex alignItems={'center'} gap={4}>
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
        <IconWithPopover
          name={'park-more'}
          size={13}
          renderOnParent={false}
          onClick={e => e.stopPropagation()}
          className={ClassName.flatButton(4, '3px')}
          content={setV => (
            <WithBorder onClick={e => e.stopPropagation()} padding={4} width={140}>
              {[
                {
                  icon: 'park-corner-up-right',
                  text: t('general.Move to'),
                  onClick: async () => {
                    setV(false)
                    if (!isMeta) {
                      const m = await addFeedAsMeta(itemId)
                      if (m) {
                        GlobalInstance.metaOps?.quickAdd(m.id)
                      }
                    } else {
                      if (metaId) {
                        GlobalInstance.metaOps?.quickAdd(metaId)
                      }
                    }
                  }
                },
                {
                  icon: 'park-link',
                  text: t('general.Copy link'),
                  onClick: async () => {
                    setV(false)
                    navigator.clipboard.writeText(item?.link)
                  }
                }
              ].map(i => (
                <Button.IconButton
                  style={{
                    padding: '2px 8px'
                  }}
                  {...i}
                  key={i.icon}
                />
              ))}
            </WithBorder>
          )}
        ></IconWithPopover>
      </Content>
    </Content>
  )
}

export default ItemsToolbar
