import useFeedState, { FeedStateAtom } from '@/core/components/feed/hooks/useFeedState'
import Webpage from '@/core/components/webpage/Webpage'
import { useEffect, useMemo, useState, memo, useLayoutEffect, useRef } from 'react'
import { Content, Icon, Tooltip } from '@/components'
import { Colors } from '@/consts'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { ClassName } from 'rendevoz'
import { useGlobalAtomValue, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { UrlToWebpageMap } from '@/core/components/webpage/hooks/useWebpageContent'
import { TransformGoogleNewsLinkToRealLink } from '@/core/components/feed/utils/googleNewsScraper'
import moveToReadLater from '@/core/components/feed/utils/moveToReadLater'
import removeReadLater from '@/core/components/feed/utils/removeReadLater'
import FeedPodcastRenderer from '@/core/components/feed/components/FeedPodcastRenderer'
import { ObjectStore } from '@/api/stores'
import FeedYoutubeRenderer from '@/core/components/feed/components/FeedYoutubeRenderer'
import addFeedAsMeta from '@/core/components/feed/utils/service/addFeedAsMeta'
import { FEED_CONTENT_CACHE } from '@/core/components/feed/contentCache'
import { useUpdate } from 'react-use'
import { useSetAtom } from 'jotai'

const FeedContentRenderer = () => {
  console.log('rerender')
  const currentFocusedFeedItemId = useSelectAtomValue(FeedStateAtom, s => s.currentFocusedFeedItemId)
  const modalOpen = useSelectAtomValue(FeedStateAtom, s => s.modalOpen)
  const setFeedState = useSetAtom(FeedStateAtom)
  const displayMode = KeyvalueStore.useValue('feedOpenMode')
  const currentItem = ObjectStore('feed').useValue(currentFocusedFeedItemId)
  const alreadySaved = useGlobalAtomValue(UrlToWebpageMap).get(currentItem?.link || '')
  const readLaters = KeyvalueStore.useValue('feedReadLaterIds') || []
  const alreadyReadLater = currentItem && readLaters.includes(currentItem.id)
  const [isLoading, setIsLoading] = useState(false)
  const [failLoading, setFailLoading] = useState(false)
  const contentCache = currentItem && FEED_CONTENT_CACHE.get(currentItem.id)
  const fakeLoad = useRef(false)
  console.log(displayMode)
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
  if (currentItem?.feedType === 'youtube') {
    return (
      <Content
        style={{
          height: '100%',
          width: '100%'
        }}
      >
        {displayMode === 'sidePeek' && (
          <Icon
            name={modalOpen ? 'park-double-right' : 'park-double-left'}
            className={ClassName.flatButton(4, '6px')}
            size={20}
            onClick={() => {
              setFeedState(s => ({ ...s, modalOpen: !s.modalOpen }))
            }}
            containerStyle={{
              position: 'absolute',
              color: Colors.Font.Transparent,
              left: -40,
              top: '20px',
              transform: 'translateY(-50%)',
              zIndex: 15
            }}
          />
        )}
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
        {displayMode === 'sidePeek' && (
          <Icon
            name={modalOpen ? 'park-double-right' : 'park-double-left'}
            className={ClassName.flatButton(4, '6px')}
            size={20}
            onClick={() => {
              setFeedState(s => ({ ...s, modalOpen: !s.modalOpen }))
            }}
            containerStyle={{
              position: 'absolute',
              color: Colors.Font.Transparent,
              left: -40,
              top: '20px',
              transform: 'translateY(-50%)',
              zIndex: 15
            }}
          />
        )}
        <FeedPodcastRenderer />
      </Content>
    )
  }

  if (currentItem && !currentItem.link.includes('news.google.com')) {
    return (
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
            onFailLoad={() => {
              if (contentCache) {
                setFailLoading(true)
              }
            }}
            disableTabTitle={true}
            editorOptions={{
              on: async e => {
                if (e.type === 'valueChange') {
                  FEED_CONTENT_CACHE.set(currentItem.id, e.value)
                }
                if (e.type === 'titleChange') {
                  ObjectStore('feed').updateOne({ id: currentItem.id, title: e.value, state: { ...currentItem?.state, title: e.value } })
                }
              },
              header: {
                boxShadow: false,
                display: {
                  label: alreadySaved ? true : false
                },
                rightExtra: (
                  <>
                    {!alreadySaved && (
                      <Tooltip content={'Add as object'}>
                        <Icon
                          size={16}
                          className={ClassName.flatButton(4, '4px')}
                          onClick={() => {
                            addFeedAsMeta(currentItem?.id)
                          }}
                          name={'park-share-one'}
                        />
                      </Tooltip>
                    )}
                    <Tooltip content={'Read later'}>
                      <Icon
                        size={16}
                        className={ClassName.flatButton(4, '4px')}
                        onClick={() => {
                          if (alreadyReadLater) {
                            removeReadLater(currentItem.id)
                          } else {
                            moveToReadLater(currentItem.id)
                          }
                        }}
                        containerStyle={{
                          color: alreadyReadLater ? 'yellow' : 'unset'
                        }}
                        theme={alreadyReadLater ? 'filled' : undefined}
                        name={'park-star'}
                      />
                    </Tooltip>
                  </>
                ),
                leftExtra:
                  displayMode === 'sidePeek' ? (
                    <Icon
                      size={16}
                      className={ClassName.flatButton(4, '4px')}
                      onClick={() => setFeedState(s => ({ ...s, modalOpen: false }))}
                      name={'park-right'}
                    />
                  ) : undefined
              }
            }}
            onStartLoad={() => {
              setIsLoading(true)
              setFailLoading(false)
            }}
            onEndLoad={() => {
              if (isLoading && !fakeLoad.current) {
                setIsLoading(false)
              }

              setFailLoading(false)
            }}
            onWebpageParsed={memoparse}
            initialUrl={currentItem.link}
            state={currentItem.state ? { ...currentItem.state, content: memoedContent } : undefined}
          />
        </Content>
      </Content>
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
