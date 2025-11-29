import { useMemo, memo, useRef } from 'react'
import { Content, Icon, IconWithPopover } from '@/components'
import { Colors, Icons } from '@/consts'
import { useGlobalAtomValue, useMemoizedFn } from '@/hooks'
import { ObjectStore } from '@/api/stores'
import { FEED_CONTENT_CACHE } from '@/core/components/feed/contentCache'
import { useUpdate } from 'react-use'
import { urlToIdMap } from '@/api/indexData/urlToId'
import { useParams } from 'react-router-dom'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import useFeedIsMeta from '@/core/components/feed/hooks/useFeedIsMeta'
import addFeedAsMeta from '@/core/components/feed/utils/service/addFeedAsMeta'
import classnames from 'classnames'
import { IParsedWebpage, IWebpageInstance } from '~/typings'
import FeedItemMenu from '@/core/components/feed/components/FeedItemMenu'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import UncontrolledWebpage from '@/core/components/webpage/UncontrolledWebpage'
import { StarAndSaveToFolder } from '@/core/components'

const FeedContentRenderer = () => {
  const { id } = useParams()
  const currentFocusedFeedItemId = id ? Number(id) : undefined
  const currentItem = ObjectStore('feed').useValue(currentFocusedFeedItemId)
  const alreadySaved = useGlobalAtomValue(urlToIdMap).get(currentItem?.link || '')
  const contentCache = currentItem && FEED_CONTENT_CACHE.get(currentItem.id)
  const webpageInstanceRef = useRef<IWebpageInstance>()
  const { isMeta, metaId } = useFeedIsMeta(currentFocusedFeedItemId)
  if (currentItem?.state && !currentItem.lastRead) {
    ObjectStore('feed').updateOne({ id: currentItem.id, lastRead: Date.now() })
  }
  const menu = FeedItemMenu.useMoveToMenu({
    onGetId: async () => currentFocusedFeedItemId
  })
  const instance = useFeedInstance()
  const memoedContent = useMemo(() => {
    return contentCache
  }, [currentItem?.link, contentCache])
  const update = useUpdate()
  const handleWebpageParsed = useMemoizedFn((p: IParsedWebpage) => {
    if (currentItem) {
      const content = p.content
      FEED_CONTENT_CACHE.set(currentItem.id, structuredClone(content))
      ObjectStore('feed').updateOne({
        id: currentItem.id,
        image: p.image || currentItem.image,
        state: { ...p, content: undefined },
        lastRead: Date.now()
      })
    }
    update()
  })
  const { t } = useTranslation()
  if (currentItem && !currentItem.link.includes('news.google.com')) {
    instance.getCurrentFeedInstance = () => {
      return webpageInstanceRef.current || undefined
    }
    return (
      <UncontrolledWebpage
        onInstanceInitialized={i => {
          webpageInstanceRef.current = i
        }}
        id={alreadySaved}
        editorOptions={{
          on: async e => {
            if (e.type === 'valueChange') {
              FEED_CONTENT_CACHE.set(currentItem.id, e.value)
            }
            if (e.type === 'getSource') {
              return {
                feedId: currentItem.id
              }
            }
          },
          layout: {
            virtualizer: false
          },
          header: {
            boxShadow: false,
            display: {
              label: alreadySaved ? true : false,
              search: false
            }
          },
          state: {
            fontSize: 17,
            lineSpacing: 1.8
          }
        }}
        onWebpageParsed={handleWebpageParsed}
        url={currentItem.link}
        name={currentItem.title}
        image={currentItem.image}
        favicon={currentItem.favicon}
        value={memoedContent}
        feedCollectionId={currentItem.collectionId}
      />
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
          background: Colors.Background.Global
        }}
      >
        <div className={'normal-font super-transparent-font'}>No article selected</div>
      </Content>
    )
  }
}

const FollowIcon = () => {
  const { id } = useParams()
  const feedId = Number(id)
  const item = ObjectStore('feed').useValue(feedId)
  const { t } = useTranslation()
  const instance = useFeedInstance()
  return (
    <IconWithPopover
      content={setVisible => (
        <StarAndSaveToFolder
          type={'feedFolder'}
          onRemove={() => {
            setVisible(false)
            instance.feedOps?.follow?.(feedId, false)
            ObjectStore('feedFolder')
              .getCachedAll()
              .forEach(i => {
                if (i.feeds?.some(o => o === feedId)) {
                  ObjectStore('feedFolder').updateOne({ id: i.id, feeds: i.feeds?.filter(o => o !== feedId) })
                }
              })
          }}
          initialFolderId={() =>
            ObjectStore('feedFolder')
              .getCachedAll()
              .find(i => i.feeds?.find(o => o === feedId))?.id
          }
          onSave={(name, id) => {
            setVisible(false)
            if (item) {
              if (name !== item.title) {
                ObjectStore('feed').updateOne({ id: feedId, title: name })
              }
              const allFolders = ObjectStore('feedFolder').getCachedAll()
              allFolders.forEach(f => {
                if (f.id !== id) {
                  if (f.feeds?.some(o => o === feedId)) {
                    ObjectStore('feedFolder').updateOne({ id: f.id, feeds: f.feeds?.filter(o => o !== feedId) })
                  }
                }
              })
              if (id) {
                const currentFolder = ObjectStore('feedFolder').getCachedOneById(id)
                if (currentFolder) {
                  if (!currentFolder.feeds?.some(o => o === feedId)) {
                    ObjectStore('feedFolder').updateOne({ id, feeds: [feedId, ...(currentFolder.feeds || [])] })
                  }
                }
              }
            }
          }}
          currentName={item?.title || ''}
        />
      )}
      className={classnames('square-button', item?.followed && 'text-red-500')}
      onClick={() => {
        if (!item?.followed) {
          instance.feedOps?.follow(feedId, false)
        }
      }}
      withClickCover
      placement={['bottom']}
      tooltip={item?.followed ? undefined : t(trans.Follow)}
      name={Icons.Follow}
      theme={item?.followed ? 'filled' : undefined}
      size={16}
    ></IconWithPopover>
  )
}

const AddIcon = () => {
  const { id } = useParams()
  const feedId = Number(id)
  const { metaId, isMeta } = useFeedIsMeta(!Number.isNaN(feedId) ? feedId : undefined)
  const { t } = useTranslation()
  return (
    <Icon
      className={classnames('square-button', isMeta && 'select-color-font')}
      tooltip={t(isMeta ? trans.Meta.ViewDetails : trans.Meta.AddAsObject)}
      name={isMeta ? Icons.Info : Icons.AddAsObject}
      size={16}
      theme={isMeta ? 'filled' : undefined}
      onClick={() => {
        if (isMeta) {
          Global.metaOps.openDetails?.(metaId)
        } else {
          addFeedAsMeta(feedId, metaId).then(() => {
            toast.success(t(trans.Success.AddedSuccessfully))
          })
        }
      }}
    ></Icon>
  )
}
export default memo(FeedContentRenderer)
