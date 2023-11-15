import useFeedState from '@/core/feed/hooks/useFeedState'
import Webpage from '@/core/webpage/Webpage'
import { useEffect, useMemo, useState } from 'react'
import { Content, Icon, Tooltip } from '@/components'
import { Colors } from '@/consts'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { ClassName } from 'rendevoz'
import { useGlobalAtomValue, useMemoizedFn } from '@/hooks'
import { UrlToWebpageMap } from '@/core/webpage/hooks/useWebpageContent'
import { TransformGoogleNewsLinkToRealLink } from '@/core/feed/utils/googleNewsScraper'
import moveToReadLater from '@/core/feed/utils/moveToReadLater'
import removeReadLater from '@/core/feed/utils/removeReadLater'
import FeedPodcastRenderer from '@/core/feed/components/FeedPodcastRenderer'
import { ObjectStore } from '@/api/stores'
import FeedYoutubeRenderer from '@/core/feed/components/FeedYoutubeRenderer'
import addFeedAsMeta from '@/core/feed/utils/service/addFeedAsMeta'

const FeedContentRenderer = () => {
  const [feedState, setFeedState] = useFeedState()
  const displayMode = KeyvalueStore.useValue('feedOpenMode')
  const currentItem = ObjectStore('feed').useValue(feedState.currentFocusedFeedItemId)
  const alreadySaved = useGlobalAtomValue(UrlToWebpageMap).get(currentItem?.link || '')
  const readLaters = KeyvalueStore.useValue('feedReadLaterIds') || []
  const alreadyReadLater = currentItem && readLaters.includes(currentItem.id)
  const [isLoading, setIsLoading] = useState(false)
  const [failLoading, setFailLoading] = useState(false)
  useEffect(() => {
    if (currentItem?.link.includes('news.google.com')) {
      TransformGoogleNewsLinkToRealLink(currentItem.link).then(res => {
        ObjectStore('feed').updateOne({ id: currentItem.id, link: res })
      })
    }
  }, [currentItem?.link])
  if (currentItem?.state && !currentItem.lastRead) {
    ObjectStore('feed').updateOne({ id: currentItem.id, lastRead: Date.now() })
  }
  const memoedContent = useMemo(() => {
    return currentItem?.state?.content
  }, [currentItem?.link])
  const memoparse = useMemoizedFn(p => {
    const item = structuredClone(currentItem)
    console.log(p, item)
    if (p?.link === item.link && !item?.state) {
      ObjectStore('feed').updateOne({ id: item.id, image: item.image || p?.image, state: p, lastRead: Date.now() })
    }
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
            name={feedState.modalOpen ? 'park-right' : 'park-left'}
            className={ClassName.circleButton()}
            size={24}
            onClick={() => {
              setFeedState(s => ({ ...s, modalOpen: !s.modalOpen }))
            }}
            containerStyle={{
              position: 'absolute',
              left: -40,
              top: '50%',
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
            name={feedState.modalOpen ? 'park-right' : 'park-left'}
            className={ClassName.circleButton()}
            size={24}
            onClick={() => {
              setFeedState(s => ({ ...s, modalOpen: !s.modalOpen }))
            }}
            containerStyle={{
              position: 'absolute',
              left: -40,
              top: '50%',
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
        <Content
          fullHeight
          fullWidth
          style={{
            opacity: isLoading ? 0 : 1
          }}
        >
          <Webpage
            initialWebpageId={alreadySaved}
            onFailLoad={() => {
              if (!currentItem?.state?.content) {
                setFailLoading(true)
              }
            }}
            disableTabTitle={true}
            editorOptions={{
              on: async e => {
                if (e.type === 'valueChange') {
                  console.log(e.value, currentItem)
                  ObjectStore('feed').updateOne({ id: currentItem.id, state: { ...currentItem.state, content: e.value } })
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
              setIsLoading(false)
              setFailLoading(false)
            }}
            onWebpageParsed={memoparse}
            initialUrl={currentItem.link}
            state={currentItem.state ? { ...currentItem.state, content: memoedContent } : undefined}
          />
        </Content>
        {(isLoading || failLoading) && (
          <Content
            style={{ margin: 'auto', zIndex: 100, position: 'absolute', inset: 0 }}
            flex
            column
            alignItems={'center'}
            justifyContent={'center'}
            gap={10}
            fullWidth
          >
            {failLoading ? (
              <>
                <Icon name={'park-error'} theme={'filled'} style={{ color: Colors.Common.Red }} size={48} />
                <Content flex column alignItems={'center'} justifyContent={'center'} gap={4}>
                  <div style={{ color: Colors.Font.Transparent, fontSize: 13, maxWidth: '60%', wordBreak: 'break-word' }}>
                    Failed to load webpage
                  </div>
                  <div style={{ color: Colors.Font.Transparent, fontSize: 13, maxWidth: '80%', wordBreak: 'break-word' }}>
                    {currentItem.link}
                  </div>
                </Content>
              </>
            ) : (
              <>
                <Icon name={'park-loading-four'} spin size={48} />
                <Content flex column fullWidth alignItems={'center'} justifyContent={'center'} gap={4}>
                  <div style={{ color: Colors.Font.Transparent, fontSize: 13, maxWidth: '60%', wordBreak: 'break-word' }}>
                    Loading and parsing webpage
                  </div>
                  <div style={{ color: Colors.Font.Transparent, fontSize: 13, maxWidth: '80%', wordBreak: 'break-all' }}>
                    {currentItem.link}
                  </div>
                </Content>
              </>
            )}
          </Content>
        )}
      </Content>
    )
  }

  return (
    <Content fullHeight fullWidth flex centered style={{ background: Colors.Background.Secondary }}>
      <div className={ClassName.title()}>No article selected</div>
    </Content>
  )
}

export default FeedContentRenderer
