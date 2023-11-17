import { useState } from 'react'
import { Content, TabPane, Tabs } from '@/components'
import GoogleNewsSearch from '@/core/components/feed/components/others/GoogleNewsSearch'
import ItunesPodcastSearch from '@/core/components/feed/components/others/ItunesPodcastSearch'
import ImportNewFeed from '@/core/components/feed/components/others/ImportNewFeed'
import { useTranslation } from 'react-i18next'

const FeedHomepage = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'all articles' | 'add' | 'google news'>('google news')
  return (
    <Content fullHeight fullWidth flex justifyContent={'center'}>
      <Content
        style={{
          height: '100%',
          width: '840px',
          maxWidth: '100%',
          padding: '40px 20px'
        }}
        flex
        column
      >
        <div style={{ fontWeight: 700, fontSize: 34, marginBottom: 8, padding: '12px' }}>{t('general.Add new feeds')}</div>
        <div style={{ height: 0, flex: 1, width: '100%' }}>
          <Tabs
            tabNavContainerStyle={{
              padding: '12px 12px 0px'
            }}
            defaultActiveKey={'Google News'}
          >
            <TabPane key={'Google News'} tab={t('general.Google news')}>
              <GoogleNewsSearch />
            </TabPane>
            <TabPane key={'Import'} tab={t('general.Import from url')}>
              <ImportNewFeed />
            </TabPane>
            <TabPane tab={t('general.Itunes podcasts')} key={'Itunes podcasts'}>
              <ItunesPodcastSearch />
            </TabPane>
          </Tabs>
        </div>
      </Content>
    </Content>
  )
}
export default FeedHomepage
