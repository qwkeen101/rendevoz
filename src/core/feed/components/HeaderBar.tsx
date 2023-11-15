import { IFeedCollection } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { AnimatePopover, Button, Content, Icon, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import useFeedState from '@/core/feed/hooks/useFeedState'
import { ObjectStore } from '@/api/stores'
import useFeedInstance from '@/core/feed/hooks/useFeedInstance'
import { useEffect, useMemo, useState } from 'react'
import markAllAsRead from '@/core/feed/utils/service/markAllAsRead'

const viewToTranslate = {
  magazine: 'general.Magazine view',
  card: 'general.Card view',
  // details: 'general.Details view',
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
        padding: '8px 24px 8px 20px',
        zIndex: 99,
        borderBottom: `1px solid ${Colors.Background.Border}`
      }}
    >
      <Content flex gap={16} alignItems={'center'}>
        <Icon
          name={'custom-left-bar'}
          className={ClassName.circleButton(4, 4)}
          onClick={() => {
            setFeedState(s => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }))
          }}
        />
        {currentCollection?.icon && <img src={currentCollection.icon} height={32} style={{ borderRadius: 4, objectFit: 'cover' }} />}
        <div className={ClassName.ellipsisFont(1)} style={{ fontSize: 18, fontWeight: 600, flexShrink: 1 }}>
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
            text={'Mark all as read'}
            className={ClassName.selectButton()}
            style={{ fontSize: 14, fontWeight: 600 }}
          />
        )}
        <Icon
          size={20}
          name={'park-up'}
          onClick={() => {
            instance.navigateOps?.back()
          }}
          className={ClassName.circleButton(4, 4)}
        />
        <Icon
          size={20}
          name={'park-down'}
          onClick={() => {
            instance.navigateOps?.forward()
          }}
          className={ClassName.circleButton(4, 4)}
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
          <Icon size={20} name={'park-preview-open'} className={ClassName.circleButton(4, 4)} />
        </AnimatePopover>
      </Content>
    </Content>
  )
}

export default FeedHeaderBar
