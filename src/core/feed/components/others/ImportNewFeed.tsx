import { Content, IconWithPopover, Modal, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import fetchFeedAndAddCollection, { transformFeedUrl } from '@/core/feed/utils/fetchFeedAndAddCollection'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounceEffect } from '@/hooks'
import Parser from 'rss-parser'
const parser = new Parser()
export default () => {
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [feedDetails, setFeedDetails] = useState<{
    isLoading: boolean
    details?: { title?: string; thumbnail?: string; description?: string }
  }>()
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
    { wait: 1000 }
  )
  console.log(feedDetails)
  return (
    <Content style={{ width: '100%', padding: '20px' }}>
      <Content column flex gap={12}>
        <div>Feed url</div>
        <Content style={{ fontSize: 13, color: Colors.Font.Transparent }}>
          <div>Tips:</div>
          <div>1. Youtube channels and playlists are supported. (e.g. https://www.youtube.com/@BBCNews)</div>
          <div>2. Some feeds may not return correct thumbnail / content.</div>
          <div>3. Websites require subscriptions may not return correct content.</div>
        </Content>
      </Content>
      <input
        onChange={e => setNewFeedUrl(e.target.value)}
        value={newFeedUrl}
        placeholder={'Add any feed url'}
        className={ClassName.noStyleInput}
        style={{
          width: '100%',
          borderBottom: `1px solid ${Colors.Background.Border}`,
          marginBottom: 24,
          marginTop: 16
        }}
      ></input>
      {feedDetails?.details && (
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
          className={ClassName.flatButton(undefined, '4px 12px', undefined, true)}
        >
          {t('general.Cancel')}
        </div>
        <div
          onClick={() => {
            setNewFeedUrl('')
            if (newFeedUrl) {
              fetchFeedAndAddCollection(newFeedUrl, 'webpage')
            }
          }}
          className={ClassName.flatButton(undefined, '4px 12px', undefined, true)}
        >
          {t('general.confirm')}
        </div>
      </Content>
    </Content>
  )
}
