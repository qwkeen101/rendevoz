import { IYoutubeSearchResultItem } from '@/core/components/feed/youtube/YoutubeServices'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useNorepeatNavigate } from '@/hooks'
import ImageTitleItem from '@/core/components/feed/youtube/components/ImageTitleItem'
import { Icon } from '@/components'
import { Icons } from '@/consts'
import { ObjectStore } from '@/api/stores'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/feed/youtube/YoutubeItemMenu'
import YoutubeChannels from '@/core/components/feed/youtube/YoutubeChannels'
import YoutubePlaylists from '@/core/components/feed/youtube/YoutubePlaylists'
import { RefObject } from 'react'
const YoutubeDashboardPane = ({
  items,
  scrollKey,
  scrollElementRef
}: {
  items: IYoutubeSearchResultItem[]
  scrollKey: string
  scrollElementRef: RefObject<HTMLDivElement>
}) => {
  if (!items.length) {
    return (
      <div className={'w-full grow flex items-center justify-center'}>
        <Icon name={Icons.Loading} spin size={40} />
      </div>
    )
  }
  return (
    <YoutubeChannels
      gapClassName={'pb-6 gap-6'}
      maxColumns={999}
      scrollKey={scrollKey}
      scrollElementRef={scrollElementRef}
      hasMore={false}
      contextMenu={(idx, children) => (
        <ContextMenu
          content={setV => (
            <YoutubeItemMenu
              id={items[idx].snippet.channelId}
              type={'channel'}
              onClose={() => {
                setV(false)
              }}
            />
          )}
        >
          {children}
        </ContextMenu>
      )}
      onLoadMore={() => {}}
      items={items.map(i => ({
        snippet: {
          title: i.snippet.title,
          description: i.snippet.description,
          channelId: i.snippet.channelId,
          thumbnails: i.snippet.thumbnails
        }
      }))}
    />
  )
}

const ItemPane = ({
  items,
  type,
  scrollElementRef,
  scrollKey
}: {
  items: number[]
  type: 'channel' | 'playlist'
  scrollKey: string
  scrollElementRef: RefObject<HTMLDivElement>
}) => {
  const itemz = ObjectStore(type === 'channel' ? 'youtubeChannel' : 'youtubePlaylist').useMultiple(items)
  console.log(itemz)
  if (type === 'channel') {
    return (
      <YoutubeChannels
        gapClassName={'pb-6 gap-6'}
        maxColumns={999}
        scrollKey={scrollKey}
        contextMenu={(idx, children) => (
          <ContextMenu
            content={setV => (
              <YoutubeItemMenu
                id={itemz[idx].id}
                type={'channel'}
                onClose={() => {
                  setV(false)
                }}
              />
            )}
          >
            {children}
          </ContextMenu>
        )}
        onLoadMore={() => {}}
        hasMore={false}
        scrollElementRef={scrollElementRef}
        items={itemz.map(i => ({
          snippet: {
            title: i.name,
            description: i.description,
            channelId: i.channelId,
            thumbnails: {
              high: {
                url: i.thumbnail
              }
            }
          }
        }))}
      />
    )
  }
  if (type === 'playlist') {
    return (
      <YoutubePlaylists
        maxColumns={999}
        gapClassName={'gap-6 pb-6'}
        scrollKey={scrollKey}
        scrollElementRef={scrollElementRef}
        onLoadMore={() => {}}
        hasMore={false}
        contextMenu={(idx, children) => (
          <ContextMenu
            content={setV => (
              <YoutubeItemMenu
                id={itemz[idx].id}
                type={'playlist'}
                onClose={() => {
                  setV(false)
                }}
              />
            )}
          >
            {children}
          </ContextMenu>
        )}
        items={itemz.map(i => ({
          id: i.playlistId,
          contentDetails: {
            itemCount: i.itemCount
          },
          snippet: {
            title: i.name,
            description: i.description,
            thumbnails: {
              high: {
                url: i.thumbnail
              }
            }
          }
        }))}
      />
    )
  }
}

YoutubeDashboardPane.ItemPane = ItemPane
export default YoutubeDashboardPane as typeof YoutubeDashboardPane & {
  ItemPane: typeof ItemPane
}