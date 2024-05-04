import { FeedStateAtom } from '@/core/components/feed/hooks/useFeedState'
import Webpage from '@/core/components/webpage/Webpage'
import { useMemo, useState, memo, useLayoutEffect, useRef } from 'react'
import { Content } from '@/components'
import { Colors } from '@/consts'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { ClassName } from 'rendevoz'
import { useGlobalAtomValue, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { TransformGoogleNewsLinkToRealLink } from '@/core/components/feed/utils/googleNewsScraper'
import FeedPodcastRenderer from '@/core/components/feed/components/FeedPodcastRenderer'
import { ObjectStore } from '@/api/stores'
import FeedYoutubeRenderer from '@/core/components/feed/components/FeedYoutubeRenderer'
import { FEED_CONTENT_CACHE } from '@/core/components/feed/contentCache'
import { useUpdate } from 'react-use'
import TweetRenderer from '@/core/components/tweet/TweetRenderer'
import { urlToIdMap } from '@/api/indexData/urlToId'

const FeedContentRenderer = () => {
  const currentFocusedFeedItemId = useSelectAtomValue(FeedStateAtom, s => s.currentFocusedFeedItemId)
  const displayMode = KeyvalueStore.useValue('feedOpenMode')
  const currentItem = ObjectStore('feed').useValue(currentFocusedFeedItemId)
  const alreadySaved = useGlobalAtomValue(urlToIdMap).get(currentItem?.link || '')

  const [isLoading, setIsLoading] = useState(false)
  const contentCache = currentItem && FEED_CONTENT_CACHE.get(currentItem.id)
  const fakeLoad = useRef(false)
  useLayoutEffect(() => {
    if (currentItem?.link.includes('news.google.com')) {
      TransformGoogleNewsLinkToRealLink(currentItem.link).then(res => {
        ObjectStore('feed').updateOne({ id: currentItem.id, link: res })
      })
    }
    if (contentCache) {
      fakeLoad.current = true
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        fakeLoad.current = false
      }, 400)
    }
  }, [currentItem?.link])
  if (currentItem?.state && !currentItem.lastRead) {
    ObjectStore('feed').updateOne({ id: currentItem.id, lastRead: Date.now() })
  }
  const memoedContent = useMemo(() => {
    return contentCache
  }, [currentItem?.link])
  const update = useUpdate()

  const memoparse = useMemoizedFn(p => {
    const item = structuredClone(currentItem)
    console.log(p)
    const content = p.content
    if (item) {
      FEED_CONTENT_CACHE.set(item.id, structuredClone(content))
    }
    delete p.content

    if (p?.link === item.link && !item?.state) {
      ObjectStore('feed').updateOne({ id: item.id, image: item.image || p?.image, state: p, lastRead: Date.now() })
    }
    update()
  })
  if (currentItem?.feedType === 'youtube' || currentItem?.feedType === 'bilibili') {
    return (
      <Content
        className={'border-left'}
        style={{
          height: '100%',
          width: '100%'
        }}
      >
        <FeedYoutubeRenderer />
      </Content>
    )
  }
  if (currentItem?.feedType == 'podcast') {
    return (
      <Content
        style={{
          height: '100%',
          width: '100%'
        }}
      >
        <FeedPodcastRenderer />
      </Content>
    )
  }
  if (currentItem?.feedType === 'tweet') {
    const splitted = currentItem.link.split('/')
    const statusIdx = splitted.findIndex(i => i === 'status')
    const id = splitted[statusIdx + 1]
    return (
      <Content
        style={{
          height: '100%',
          width: '100%',
          borderRadius: displayMode === 'center' ? 12 : 0,
          borderLeft: displayMode !== 'center' ? `1px solid ${Colors.Background.Border}` : undefined,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: 24,
            height: '100%',
            width: '100%',
            overflowY: 'auto',
            display: 'flex'
          }}
        >
          <TweetRenderer tweetId={id} />
        </div>
      </Content>
    )
  }
  if (currentItem && !currentItem.link.includes('news.google.com')) {
    return (
      <>
        <Content
          style={{
            height: '100%',
            width: '100%',
            overflow: 'hidden',
            borderRadius: displayMode === 'center' ? 12 : 0,
            borderLeft: displayMode !== 'center' ? `1px solid ${Colors.Background.Border}` : undefined
          }}
        >
          <Content fullHeight fullWidth>
            <Webpage
              initialWebpageId={alreadySaved}
              disableTabTitle={true}
              editorOptions={{
                on: async e => {
                  if (e.type === 'valueChange') {
                    FEED_CONTENT_CACHE.set(currentItem.id, e.value)
                  }
                  if (e.type === 'titleChange') {
                    console.log(currentItem?.state, e.value)
                    if (currentItem?.state?.translatedTitle) {
                      return
                    }
                    ObjectStore('feed').updateOne({
                      id: currentItem.id,
                      title: e.value,
                      state: {
                        ...currentItem?.state,
                        translatedTitle: e.value
                      }
                    })
                  }
                },
                header: {
                  boxShadow: false,
                  display: {
                    label: alreadySaved ? true : false
                  }
                }
              }}
              onStartLoad={() => {
                setIsLoading(true)
              }}
              onEndLoad={() => {
                if (isLoading && !fakeLoad.current) {
                  setIsLoading(false)
                }
              }}
              onWebpageParsed={memoparse}
              initialUrl={currentItem.link}
              state={
                currentItem.state
                  ? {
                      ...currentItem.state,
                      content: memoedContent,
                      title: currentItem.title
                    }
                  : { title: currentItem.title }
              }
            />
          </Content>
        </Content>
      </>
    )
  }

  if (!currentItem) {
    return (
      <Content
        fullHeight
        fullWidth
        flex
        centered
        style={{
          background: Colors.Background.Global,
          borderLeft: displayMode === 'rightBar' ? '1px solid var(--border-background)' : undefined
        }}
      >
        <div className={ClassName.title()}>No article selected</div>
      </Content>
    )
  }
}

export default memo(FeedContentRenderer)
