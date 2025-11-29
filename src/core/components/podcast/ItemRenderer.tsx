import { ObjectStore } from '@/api/stores'
import { memo } from 'react'
import { Icon, IconWithPopover, WithBorder } from '@/components'
import classnames from 'classnames'
import PodcastMenu from '@/core/components/feed/components/podcast/menu/PodcastMenu'
import formatReleaseDate from '@/core/components/feed/components/podcast/utils/formatReleaseDate'
import formatEpisodeDuration from '@/core/components/feed/components/podcast/utils/formatEpisodeDuration'
import { DateFormat } from '@/utils'
import ContextMenu from '@/components/contextMenu'
import useEpisodeIsMeta from '@/core/components/feed/components/podcast/hooks/useEpisodeIsMeta'

export default memo(
  ({ id, type, onClick, columnMode }: { id: number; type: 'episode' | 'podcast'; onClick?: VoidFunction; columnMode?: boolean }) => {
    switch (type) {
      case 'episode':
        return <EpisodeItem onClick={onClick} id={id} columnMode={columnMode} />
      case 'podcast':
        return <PodcastItem onClick={onClick} id={id} columnMode={columnMode} />
    }
  }
)

const PodcastItem = ({ id, onClick, columnMode }: { id: number; onClick?: VoidFunction; columnMode?: boolean }) => {
  const podcast = ObjectStore('podcast').useValue(id)
  if (!podcast) return null
  return (
    <ContextMenu content={setV => <PodcastMenu id={id} type={'podcast'} onClose={() => setV(false)} />}>
      <div
        className={
          'border shrink-0 relative hover:scale-[1.01] transition-transform rounded-lg overflow-hidden flex items-center cursor-pointer'
        }
        onClick={onClick}
      >
        {podcast?.thumbnail && (
          <img
            className={
              columnMode ? 'w-full h-auto absolute top-1/2 -translate-y-1/2 opacity-[0.08] dark:opacity-10' : 'object-cover w-28 h-28'
            }
            src={podcast.thumbnail}
          />
        )}
        <div className={classnames('flex w-full items-center gap-4', columnMode ? 'p-3' : 'px-5')}>
          <div className={classnames('flex flex-col mr-auto', columnMode ? 'gap-1' : 'gap-0.5')}>
            <div className={classnames('items-center gap-2 flex font-medium', columnMode ? 'text-base' : 'text-lg')}>
              {columnMode && podcast.thumbnail && <img className={'object-cover w-6 h-6 rounded'} src={podcast.thumbnail} />}
              {podcast.name}
            </div>
            <div className={'transparent-font ellipsis-font-2 text-sm'}>{podcast.description}</div>
            {podcast.followedAt && (
              <div className={'transparent-font text-sm'}>
                Followed: {DateFormat.format(podcast.followedAt, DateFormat.Formats.yearMonthDays)}
              </div>
            )}
          </div>
          <IconWithPopover
            name={'park-more'}
            placement={['right', 'left']}
            align={'start'}
            content={setV => <PodcastMenu onClose={() => setV(false)} type={'podcast'} id={podcast.id} />}
            containerStyle={{
              marginBottom: 'auto'
            }}
            onClick={e => e.stopPropagation()}
            className={'text-2xl !p-1 button'}
          ></IconWithPopover>
        </div>
      </div>
    </ContextMenu>
  )
}

const EpisodeItem = ({ id, onClick, columnMode }: { id: number; onClick?: VoidFunction; columnMode?: boolean }) => {
  const episode = ObjectStore('episode').useValue(id)
  const isMeta = useEpisodeIsMeta(id)
  if (!episode) return null
  const { releaseDate, duration, thumbnail, description, name } = episode
  return (
    <ContextMenu content={setV => <PodcastMenu id={id} type={'episode'} onClose={() => setV(false)} />}>
      <div
        className={
          'border shrink-0 relative hover:scale-[1.01] transition-transform rounded-lg overflow-hidden flex items-center cursor-pointer'
        }
        onClick={onClick}
      >
        {thumbnail && (
          <img
            className={
              columnMode ? 'w-full h-auto absolute top-1/2 -translate-y-1/2 opacity-[0.08] dark:opacity-10' : 'object-cover w-28 h-28'
            }
            src={thumbnail}
          />
        )}
        <div className={classnames('flex w-full items-center gap-4', columnMode ? 'p-3' : 'px-5')}>
          <div className={classnames('flex flex-col mr-auto', columnMode && 'gap-1')}>
            <div className={'transparent-font gap-1 flex text-sm'}>
              <span>{formatReleaseDate(releaseDate)}</span>
              <span>·</span>
              <span>{formatEpisodeDuration(duration)}</span>
              {isMeta && <Icon className={'ml-1'} name={'park-share-one'} />}
            </div>
            <div className={classnames('items-center gap-2 flex font-medium', columnMode ? 'text-base' : 'text-lg')}>
              {columnMode && episode.thumbnail && <img className={'object-cover w-6 h-6 rounded'} src={thumbnail} />}
              {name}
            </div>
            <div className={'transparent-font ellipsis-font-2 text-sm'}>{description}</div>
          </div>
          <IconWithPopover
            name={'park-more'}
            placement={['right', 'left']}
            align={'start'}
            content={setV => <PodcastMenu onClose={() => setV(false)} type={'episode'} id={episode.id} />}
            containerStyle={{
              marginBottom: 'auto'
            }}
            onClick={e => e.stopPropagation()}
            className={'text-2xl !p-1 button'}
          ></IconWithPopover>
        </div>
      </div>
    </ContextMenu>
  )
}
