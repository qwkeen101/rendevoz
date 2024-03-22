import { Content, Icon, IconWithPopover, Modal, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import fetchFeedAndAddCollection, { transformFeedUrl } from '@/core/components/feed/utils/fetchFeedAndAddCollection'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounceEffect } from '@/hooks'
import Parser from 'rss-parser'
import toast from 'react-hot-toast'
const parser = new Parser()
export default () => {
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [feedDetails, setFeedDetails] = useState<{
    isLoading: boolean
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
    <Content style={{ width: '100%', padding: '20px' }}>
      <Content column flex gap={12}>
        <Content style={{ fontSize: 13, color: Colors.Font.Transparent }}>
          <div>Tips:</div>
          <div>1. Youtube channels and playlists are supported. (e.g. https://www.youtube.com/@BBCNews)</div>
          <div>
            2. Set your{' '}
            <a target={'_blank'} href={'https://developers.google.com/youtube/v3/getting-started'}>
              Youtube API Key
            </a>{' '}
            in setting-general-others to get all videos in playlist/channel.
          </div>
          <div>3. Twitter user tweets and search results are supported. (e.g. https://twitter.com/elonmusk)</div>
          <div>4. Some feeds may not return correct thumbnail / content.</div>
          <div>5. Websites require subscriptions may not return correct content.</div>
        </Content>
      </Content>
      <input
        onChange={e => setNewFeedUrl(e.target.value)}
        value={newFeedUrl}
        placeholder={'Type any feed url here...'}
        className={ClassName.noStyleInput}
        style={{
          width: '100%',
          borderBottom: `1px solid ${Colors.Background.Border}`,
          marginBottom: 24,
          marginTop: 16
        }}
      ></input>
      {feedDetails?.isLoading ? (
        <Content flex gap={12} style={{ marginBottom: 24 }}>
          <Icon name={'park-loading-four'} spin size={20} />
          <div>Loading feed details...</div>
        </Content>
      ) : null}
      {feedDetails?.details && !feedDetails.isLoading && (
        <Content fullWidth style={{ marginBottom: 24 }}>
          <div style={{ color: Colors.Font.Transparent }}>Feed details</div>
          <Content flex alignItems={'center'}>
            <Content>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{feedDetails.details.title}</div>
              <div style={{ fontSize: 14, color: Colors.Font.Transparent }}>{feedDetails.details.description}</div>
            </Content>
          </Content>
        </Content>
      )}
      <Content flex justifyContent={'space-between'}>
        <div
          onClick={() => {
            setNewFeedUrl('')
          }}
          className={ClassName.flatButton(undefined, '2px 14px', undefined, true)}
        >
          {t('general.Cancel')}
        </div>
        <div
          onClick={() => {
            setNewFeedUrl('')
            if (newFeedUrl) {
              setIsImporting(true)
              fetchFeedAndAddCollection(newFeedUrl, 'webpage').then(() => setIsImporting(false))
            }
          }}
          className={ClassName.selectButton(undefined, '2px 14px')}
        >
          {isImporting ? 'Loading...' : t('general.OK')}
        </div>
      </Content>
    </Content>
  )
}
