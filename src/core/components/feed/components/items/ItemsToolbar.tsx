import { Content, Icon, IconWithPopover, Menu, WithBorder } from '@/components'
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
import toast from 'react-hot-toast'
import { useAtomValue } from 'jotai/react'

const ItemsToolbar = ({ itemId }: { itemId: number }) => {
  const item = ObjectStore('feed').useValue(itemId)
  const currentReadLater = KeyvalueStore.useValue('feedReadLaterIds') || []
  const isReadLater = useAtomValue(useFeedState.readLaterIdsAtom).has(itemId)
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
          placement={['right', 'left']}
          name={'park-more'}
          align={'start'}
          size={13}
          padding={6}
          renderOnParent={false}
          onClick={e => e.stopPropagation()}
          className={ClassName.flatButton(4, '3px')}
          content={setV => (
            <WithBorder onClick={e => e.stopPropagation()} padding={'0.4rem 0'} width={180}>
              <Menu.NavigationMenu
                layout={[
                  metaId
                    ? {
                        type: 'item',
                        key: 'view-details',
                        icon: 'park-info',
                        text: t('general.View details'),
                        onSelect: () => {
                          setV(false)
                          GlobalInstance.metaOps?.openDetails(metaId)
                        }
                      }
                    : undefined,
                  {
                    key: 'move-to',
                    type: 'item',
                    icon: 'park-corner-up-right',
                    text: t('general.Move to'),
                    onSelect: async () => {
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
                    key: 'copy-link',
                    type: 'item',
                    icon: 'park-link',
                    text: t('general.Copy link'),
                    onSelect: async () => {
                      setV(false)
                      navigator.clipboard.writeText(item?.link)
                      toast.success(t('general.Copied'))
                    }
                  },
                  item?.link ? { type: 'separator' } : undefined
                ]}
              />
              {item.link && (
                <div style={{ padding: '0px 8px' }} className={'transparent-font font-size-12'}>
                  <div style={{ maxWidth: 200, wordBreak: 'break-all' }}>{item?.link}</div>
                </div>
              )}
            </WithBorder>
          )}
        ></IconWithPopover>
      </Content>
    </Content>
  )
}

export default ItemsToolbar
