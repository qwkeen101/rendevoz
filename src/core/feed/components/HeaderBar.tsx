import { IFeedCollection } from '~/typings'
import KeyvalueStore from '@/stores/keyvalue.store'
import { AnimatePopover, Content, Icon, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import useFeedState from '@/core/feed/hooks/useFeedState'
import { ObjectStore } from '@/stores'
import useFeedInstance from '@/core/feed/hooks/useFeedInstance'

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
  const { t } = useTranslation()
  const [feedState, setFeedState] = useFeedState()
  const instance = useFeedInstance()
  const currentCollection = ObjectStore('feedCollection').useValue(feedState.currentCollectionId)
  return (
    <Content
      flex
      justifyContent={'space-between'}
      alignItems={'center'}
      fullWidth
      gap={20}
      style={{
        padding: '12px 24px 12px 20px',
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
        <div className={ClassName.ellipsisFont(1)} style={{ fontSize: 18, fontWeight: 600 }}>
          {currentCollection?.name || feedState.headerName}
        </div>
      </Content>
      <Content flex gap={6}>
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
                  }}
                >
                  {t(openToTranslate[k])}
                </Content>
              ))}
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
