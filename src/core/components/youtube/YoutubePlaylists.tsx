import youtubeServices, { IYoutubePlaylistItem, IYoutubeVideoItem } from '@/core/components/feed/youtube/YoutubeServices'
import InfiniteScroll from 'react-infinite-scroller'
import { ReactElement, RefObject, useEffect, useMemo, useRef, useState } from 'react'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useMeasure, useNorepeatNavigate } from '@/hooks'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import thief from 'colorthief'
import VirtualLoader from '@/core/components/feed/youtube/components/VirtualLoader'
import ImageTitleItem from '@/core/components/feed/youtube/components/ImageTitleItem'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/feed/youtube/YoutubeItemMenu'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
const c = new thief()
export default ({
  items,
  onLoadMore,
  scrollElementRef,
  gapClassName = 'gap-5 pb-5',
  contextMenu = (i, c) => (
    <ContextMenu content={setV => <YoutubeItemMenu type={'playlist'} id={items[i].id} onClose={() => setV(false)} />}>{c}</ContextMenu>
  ),
  scrollKey,
  hasMore,
  maxColumns = 3
}: {
  items: IYoutubePlaylistItem[]
  onLoadMore: VoidFunction
  scrollKey: string
  maxColumns?: number
  contextMenu?: (index: number, children: ReactElement) => ReactElement
  scrollElementRef: RefObject<HTMLDivElement>
  hasMore: boolean
  gapClassName?: string
}) => {
  const { t } = useTranslation()
  const instance = useFeedInstance()
  const { width } = useMeasure(scrollElementRef)
  const cols = Math.min(Math.floor(width / 400) + 1, maxColumns)
  const rows = items.length % cols === 0 ? items.length / cols : Math.floor(items.length / cols) + 1
  return (
    <VirtualLoader
      className={'pb-40'}
      hasMore={hasMore}
      renderItem={idx => {
        const sliced = items.slice(idx * cols, (idx + 1) * cols)
        return (
          <div
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
            className={classnames('grid', gapClassName)}
          >
            {sliced.map((i, index) =>
              contextMenu(
                idx * cols + index,
                <ImageTitleItem
                  onClick={() => {
                    instance.youtubeOps?.addPlaylist(i.id).then(res => {
                      instance.youtubeOps?.goTo(res.id, 'playlist')
                    })
                  }}
                  aboveTitle={
                    i.contentDetails?.itemCount ? (
                      <div className={'text-white font-size-12'}>{t('feed.VideoCount', { count: i.contentDetails.itemCount })}</div>
                    ) : null
                  }
                  id={i.id}
                  image={i.snippet.thumbnails?.high?.url}
                  title={i.snippet.title}
                  description={i.snippet.description}
                  key={i.id}
                />
              )
            )}
          </div>
        )
      }}
      scrollKey={scrollKey}
      size={260}
      onLoadMore={onLoadMore}
      overscan={1}
      count={rows}
      scrollElementRef={scrollElementRef}
    ></VirtualLoader>
  )
}
