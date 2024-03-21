import { IFeedCollection } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { AnimatePopover, Button, Content, Icon, IconWithPopover, Modal, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import useFeedState from '@/core/components/feed/hooks/useFeedState'
import { GroupStore, MetaStore, ObjectStore } from '@/api/stores'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useEffect, useMemo, useState } from 'react'
import markAllAsRead from '@/core/components/feed/utils/service/markAllAsRead'
import ChooseGroupForm from '@/components/form/quickAdd/ChooseGroupForm'
import { GlobalInstance } from '@/hooks'
import classnames from 'classnames'
import transformItemsIntoMetas from '@/core/components/feed/utils/service/transformItemsIntoMetas'

const viewToTranslate = {
  magazine: 'general.Magazine view',
  card: 'general.Card view',
  title: 'general.Title view'
}

const openToTranslate = {
  rightBar: 'general.Right bar',
  center: 'general.Center',
  sidePeek: 'general.Side peek'
}
const FeedHeaderBar = () => {
  const cardMode = KeyvalueStore.useValue('feedCardView') || 'magazine'
  const openMode = KeyvalueStore.useValue('feedOpenMode') || 'rightBar'
  const readMode = KeyvalueStore.useValue('feedReadRule') || 'all'
  const { t } = useTranslation()
  const [feedState, setFeedState] = useFeedState()
  const instance = useFeedInstance()
  const currentCollection = ObjectStore('feedCollection').useValue(feedState.currentCollectionId)
  const allItems = feedState.filteredFeedItems || feedState.allFeedItems
  const readItems = KeyvalueStore.useValue('feedReadIds')
  const [alreadyReadAll, setAlreadyReadAll] = useState(false)
  const [moveGroupVisible, setMoveGroupVisible] = useState(false)
  useEffect(() => {
    if (readItems) {
      const realIds = new Set(readItems)
      if (allItems.filter(i => realIds.has(i)).length === allItems.length) {
        setAlreadyReadAll(true)
        return
      }
    }
    setAlreadyReadAll(false)
  }, [readItems?.length, allItems.length])
  return (
    <Content
      flex
      justifyContent={'space-between'}
      alignItems={'center'}
      fullWidth
      gap={20}
      style={{
        padding: '8px 24px 8px 10px',
        zIndex: 99,
        borderBottom: `1px solid ${Colors.Background.Border}`
      }}
    >
      <Modal zIndex={1000} visible={moveGroupVisible} onClose={() => setMoveGroupVisible(false)}>
        <ChooseGroupForm
          onPickGroup={async m => {
            if (currentCollection && !currentCollection?.relatedGroups?.includes(m)) {
              const metas = await transformItemsIntoMetas(currentCollection.items)
              const groupMeta = MetaStore.getCachedMetaObject(m)
              if (groupMeta?.objectId) {
                GroupStore.insertMetaIntoGroup(
                  metas.map(i => i.id),
                  groupMeta.objectId
                )
                ObjectStore('feedCollection').updateOne({
                  id: currentCollection.id,
                  relatedGroups: [...(currentCollection.relatedGroups || []), m]
                })
              }
            }
          }}
          onClose={() => setMoveGroupVisible(false)}
          onBack={() => setMoveGroupVisible(false)}
        />
      </Modal>
      <Content flex gap={12} alignItems={'center'}>
        <Icon
          name={'custom-left-bar'}
          size={16}
          className={ClassName.circleButton(6, 4)}
          onClick={() => {
            setFeedState(s => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }))
          }}
        />
        {currentCollection?.icon && (
          <img src={currentCollection.icon} height={24} style={{ borderRadius: 4, marginLeft: 6, objectFit: 'cover' }} />
        )}
        <div className={ClassName.ellipsisFont(1)} style={{ fontSize: 16, fontWeight: 600, flexShrink: 1 }}>
          {currentCollection?.name || feedState.headerName}
        </div>
      </Content>
      <Content flex gap={6} style={{ flexShrink: 0 }}>
        {!alreadyReadAll && (
          <Button.IconButton
            onClick={() => {
              markAllAsRead(feedState.allFeedItems, feedState.currentCollectionId)
            }}
            icon={'park-check'}
            text={t('general.Mark all as read')}
            className={ClassName.selectButton()}
            style={{ fontSize: 14, fontWeight: 600, marginRight: 12 }}
          />
        )}
        <IconWithPopover
          zIndex={999}
          size={16}
          placement={['bottom']}
          content={
            <WithBorder padding={4} width={240}>
              <div
                style={{
                  padding: '2px 6px 4px'
                }}
                className={'font-size-12 transparent-font'}
              >
                Auto move to groups
              </div>
              {currentCollection?.relatedGroups?.map(i => {
                const m = MetaStore.getCachedMetaObject(i)
                if (m && !m.deleted) {
                  return (
                    <Content
                      flex
                      alignItems={'center'}
                      justifyContent={'space-between'}
                      className={ClassName.flatButton()}
                      onClick={() => {
                        GlobalInstance.layoutOps?.openObject(m.id)
                      }}
                    >
                      <div>{m.name || m.placeholderName}</div>
                      <Icon
                        name={'park-delete'}
                        className={classnames(ClassName.flatButton(4, '4px'), 'transparent-font')}
                        onClick={e => {
                          e.stopPropagation()
                          ObjectStore('feedCollection').updateOne({
                            id: currentCollection.id,
                            relatedGroups: currentCollection?.relatedGroups?.filter(o => o !== i)
                          })
                        }}
                      />
                    </Content>
                  )
                }
              })}
              <Button.IconButton onClick={() => setMoveGroupVisible(true)} text={'Add group'} icon={'park-plus'} />
            </WithBorder>
          }
          className={ClassName.circleButton(6, 4)}
          name={'park-corner-up-right'}
          tooltip={'Auto move to groups'}
        />
        <Icon
          name={'park-up'}
          onClick={() => {
            instance.navigateOps?.back()
          }}
          size={16}
          className={ClassName.circleButton(6, 4)}
        />
        <Icon
          name={'park-down'}
          onClick={() => {
            instance.navigateOps?.forward()
          }}
          size={16}
          className={ClassName.circleButton(6, 4)}
        />
        <AnimatePopover
          positions={['bottom']}
          align={'end'}
          content={
            <WithBorder padding={4} width={150} style={{ fontSize: 14 }}>
              <div style={{ color: Colors.Font.Transparent, fontSize: 13, paddingLeft: 8, marginBottom: 2 }}>{t('general.View')}</div>
              {Object.keys(viewToTranslate).map(k => (
                <Content
                  key={k}
                  className={ClassName.flatButton()}
                  style={{
                    background: k === cardMode ? Colors.Background.ButtonActive : undefined
                  }}
                  onClick={() => {
                    KeyvalueStore.updateOne('feedCardView', k)
                  }}
                >
                  {t(viewToTranslate[k])}
                </Content>
              ))}
              <div
                style={{
                  color: Colors.Font.Transparent,
                  fontSize: 13,
                  paddingLeft: 8,
                  paddingTop: 3,
                  marginTop: 3,
                  marginBottom: 2,
                  borderTop: `1px solid ${Colors.Background.Border}`
                }}
              >
                {t('general.Open page at')}
              </div>
              {Object.keys(openToTranslate).map(k => (
                <Content
                  key={k}
                  style={{
                    background: k === openMode ? Colors.Background.ButtonActive : undefined
                  }}
                  className={ClassName.flatButton()}
                  onClick={() => {
                    KeyvalueStore.updateOne('feedOpenMode', k)
                    setFeedState(s => ({ ...s, currentFocusedFeedItemId: undefined }))
                  }}
                >
                  {t(openToTranslate[k])}
                </Content>
              ))}
              <div
                style={{
                  color: Colors.Font.Transparent,
                  fontSize: 13,
                  paddingLeft: 8,
                  paddingTop: 3,
                  marginTop: 3,
                  marginBottom: 2,
                  borderTop: `1px solid ${Colors.Background.Border}`
                }}
              >
                {t('general.Articles')}
              </div>
              <Content
                style={{
                  background: readMode === 'unread' ? Colors.Background.ButtonActive : undefined
                }}
                className={ClassName.flatButton()}
                onClick={() => {
                  KeyvalueStore.updateOne('feedReadRule', 'unread')
                }}
              >
                {t('general.Unread')}
              </Content>
              <Content
                style={{
                  background: readMode === 'all' ? Colors.Background.ButtonActive : undefined
                }}
                className={ClassName.flatButton()}
                onClick={() => {
                  KeyvalueStore.updateOne('feedReadRule', 'all')
                }}
              >
                {t('general.All articles')}
              </Content>
            </WithBorder>
          }
        >
          <Icon name={'park-preview-open'} size={16} className={ClassName.circleButton(6, 4)} />
        </AnimatePopover>
      </Content>
    </Content>
  )
}

export default FeedHeaderBar
