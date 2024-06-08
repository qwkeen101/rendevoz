import { Content, Icon, IconWithPopover, Modal, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import fetchFeedAndAddCollection, { transformFeedUrl } from '@/core/components/feed/utils/fetchFeedAndAddCollection'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounceEffect } from '@/hooks'
import Parser from 'rss-parser'
const parser = new Parser()
export default () => {
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [feedDetails, setFeedDetails] = useState<{
    isLoading?: boolean
    failed?: boolean
    details?: { title?: string; thumbnail?: string; description?: string }
  }>()
  const [isImporting, setIsImporting] = useState(false)
  const { t } = useTranslation()
  useDebounceEffect(
    () => {
      if (newFeedUrl) {
        if (!feedDetails?.isLoading) {
          transformFeedUrl(newFeedUrl).then(url => {
            if (url) {
              setFeedDetails({ isLoading: true, details: undefined })
              fetch(url)
                .then(res => res.text())
                .then(text => parser.parseString(text))
                .then(res => {
                  setFeedDetails({
                    isLoading: false,
                    details: { title: res.title, thumbnail: res.image?.url, description: res.description }
                  })
                })
                .catch(e => {
                  setFeedDetails(s => ({ ...s, failed: true, isLoading: false }))
                })
                .finally(() => {
                  setFeedDetails(s => ({ ...s, isLoading: false }))
                })
            }
          })
        }
      } else {
        setFeedDetails({ isLoading: false })
      }
    },
    [newFeedUrl],
    { wait: 500 }
  )

  return (
    <Content style={{ width: '100%', padding: '12px 20px' }}>
      <Content column flex gap={12}>
        <Content style={{ fontSize: 13, color: Colors.Font.Transparent }}>
          <div>Tips:</div>
          <ol>
            <li>
              Setup your{' '}
              <a target={'_blank'} href={'https://developers.google.com/youtube/v3/getting-started'}>
                Youtube API Key
              </a>{' '}
              in settings to get all videos in playlists or channels.
            </li>
            <li>Some results may not return correct thumbnail or content.</li>
          </ol>
          <div style={{ marginTop: 12 }}>Supported RSS:</div>
          <ul>
            <li>Any valid RSS source.</li>
            <li>Youtube channels and playlists. (e.g. https://www.youtube.com/@BBCNews)</li>
            {/*<li>Tweets from users and search results. (e.g. https://twitter.com/elonmusk)</li>*/}
          </ul>
        </Content>
      </Content>
      <input
        autoFocus
        onChange={e => setNewFeedUrl(e.target.value)}
        value={newFeedUrl}
        placeholder={t('feed.Type RSS feed URL')}
        style={{
          width: '100%',
          borderBottom: `1px solid ${Colors.Background.Border}`,
          marginBottom: 12,
          marginTop: 16
        }}
      ></input>
      {feedDetails?.isLoading ? (
        <Content flex alignItems={'center'} gap={6} style={{ fontSize: 13 }}>
          <Icon name={'park-loading-four'} spin />
          <div>Loading feed...</div>
        </Content>
      ) : null}
      {feedDetails?.details && !feedDetails.isLoading && (
        <Content fullWidth style={{ marginBottom: 12 }}>
          <Content flex alignItems={'center'}>
            <Content>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{feedDetails.details.title}</div>
              <div style={{ fontSize: 14, color: Colors.Font.Transparent }}>{feedDetails.details.description}</div>
            </Content>
          </Content>
        </Content>
      )}
      {feedDetails?.failed && (
        <Content flex alignItems={'center'} gap={6} style={{ color: Colors.Common.Red, fontSize: 13 }}>
          <Icon name={'park-caution'} />
          <div>Invalid feed source</div>
        </Content>
      )}
      {newFeedUrl && feedDetails?.details && (
        <div
          onClick={() => {
            setNewFeedUrl('')
            if (newFeedUrl) {
              setIsImporting(true)
              fetchFeedAndAddCollection(newFeedUrl, 'webpage').then(() => setIsImporting(false))
            }
          }}
          style={{
            width: 'fit-content'
          }}
          className={'select-button px-12'}
        >
          {isImporting ? t('general.Loading') + '...' : t('feed.Follow')}
        </div>
      )}
    </Content>
  )
}
