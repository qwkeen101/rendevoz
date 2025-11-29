import { useLocation, useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import { memo, useLayoutEffect, useRef } from 'react'
import FeedList from '@/core/components/feed/components/FeedList'
import { IconWithPopover } from '@/components'
import { useUpdate } from 'react-use'
import { Icons } from '@/consts'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import useFeedFilter from '@/core/components/feed/hooks/useFeedFilter'
import FeedCollectionMenu from '@/core/components/feed/components/FeedCollectionMenu'
import FeedViewChanger from '@/core/components/feed/components/components/FeedViewChanger'
import { useTranslation } from 'react-i18next'

export default memo(() => {
  const { id } = useParams()
  const collectionId = id ? Number(id) : undefined
  const feedCollection = ObjectStore('feedCollection').useValue(collectionId)
  const path = useLocation()
  const key = path.pathname
  const update = useUpdate()
  useLayoutEffect(() => {
    update()
  }, [])
  const { t } = useTranslation()
  const { renderGrouperChooser, finalResults, renderFilter } = useFeedFilter(
    feedCollection?.items,
    key,
    {
      isObject: true,
      hasHighlight: true,
      read: true,
      unread: true
    },
    false
  )
  const instance = useFeedInstance()
  const scroller = instance.scrollElementRef
  return (
    feedCollection && (
      <div className={'min-h-full p-8 flex flex-col @container pt-8'}>
        <div className={'justify-between flex mb-10'}>
          <div className={'flex gap-5 items-center shrink-1'}>
            {feedCollection.icon && feedCollection.icon !== 'gNews' && (
              <img src={feedCollection.icon} className={'rounded-md size-10 object-cover'} />
            )}
            <div className={'text-3xl font-bold line-clamp-1'}>{feedCollection.name}</div>
          </div>
          <IconWithPopover
            name={Icons.More}
            placement={['bottom']}
            className={'hover-active-button'}
            content={setV => <FeedCollectionMenu onClose={() => setV(false)} id={collectionId!} />}
          />
        </div>
        <div className={'flex gap-3 justify-between mb-3 flex-wrap'}>
          <div className={'text-xl font-semibold'}>
            {finalResults?.length ?? 0} {t('feed.Contents')}
          </div>
          <div className={'flex items-center gap-5'}>
            <FeedViewChanger />
            {renderFilter()}
            {renderGrouperChooser()}
          </div>
        </div>
        <FeedList
          showSource={feedCollection.feedUrl.includes('news.google.com/search') ? true : false}
          scrollElementRef={scroller}
          scrollKey={key}
          items={finalResults}
        />
      </div>
    )
  )
})
