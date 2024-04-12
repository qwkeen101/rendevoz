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
          width: '100%',
          maxWidth: '840px',
          padding: '28px 12px 0px'
        }}
        flex
        column
      >
        <div style={{ fontWeight: 700, fontSize: 28, padding: '12px' }}>{t('feed.Follow new feeds')}</div>
        <div style={{ height: 0, flex: 1, width: '100%' }}>
          <Tabs
            tabNavStyle={{
              fontSize: 14,
              padding: '3px 10px'
            }}
            tabNavContainerStyle={{
              padding: '12px 12px 0px'
            }}
            defaultActiveKey={'Google News'}
          >
            <TabPane key={'Google News'} tab={t('feed.News')}>
              <GoogleNewsSearch />
            </TabPane>
            <TabPane tab={t('feed.Podcasts')} key={'Itunes podcasts'}>
              <ItunesPodcastSearch />
            </TabPane>
            <TabPane key={'Import'} tab={t('feed.RSS feeds')}>
              <ImportNewFeed />
            </TabPane>
          </Tabs>
        </div>
      </Content>
    </Content>
  )
}
export default FeedHomepage
