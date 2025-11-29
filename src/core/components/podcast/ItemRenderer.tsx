import { ObjectStore } from '@/api/stores'
import { memo } from 'react'
import { IconWithPopover } from '@/components'
import classnames from 'classnames'
import PodcastMenu from '@/core/components/podcast/menu/PodcastMenu'
import formatReleaseDate from '@/core/components/podcast/utils/formatReleaseDate'
import formatEpisodeDuration from '@/core/components/podcast/utils/formatEpisodeDuration'
import ContextMenu from '@/components/contextMenu'
import { useTranslation } from 'react-i18next'
import { Icons } from '@/consts'

export default memo(
  ({
    id,
    type,
    onClick,
    columnMode,
    className,
    metaMode = false,
    parentFolderId
  }: {
    id: number
    type: 'episode' | 'podcast'
    parentFolderId?: number
    onClick?: VoidFunction
    columnMode?: boolean
    className?: string
    metaMode?: boolean
  }) => {
    switch (type) {
      case 'episode':
        return (
          <EpisodeItem
            parentFolderId={parentFolderId}
            metaMode={metaMode}
            className={className}
            onClick={onClick}
            id={id}
            columnMode={columnMode}
          />
        )
      case 'podcast':
        return <PodcastItem parentFolderId={parentFolderId} className={className} onClick={onClick} id={id} columnMode={columnMode} />
    }
  }
)

const PodcastItem = ({
  id,
  onClick,
  columnMode,
  className,
  parentFolderId
}: {
  id: number
  parentFolderId?: number
  onClick?: VoidFunction
  columnMode?: boolean
  className?: string
}) => {
  const podcast = ObjectStore('podcast').useValue(id)
  const { t } = useTranslation()
  if (!podcast) return null
  return (
    <ContextMenu content={setV => <PodcastMenu parentFolderId={parentFolderId} id={id} type={'podcast'} onClose={() => setV(false)} />}>
      <div
        className={classnames(
          'border shrink-0 light-hover relative transition-colors rounded-lg overflow-hidden flex items-center cursor-pointer',
          className
        )}
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
        <div className={classnames('flex w-full items-center gap-4', columnMode ? 'p-3' : 'px-4')}>
          <div className={classnames('flex flex-col mr-auto', columnMode ? 'gap-1' : 'gap-0.5')}>
            <div className={classnames('items-center gap-2 flex font-medium', columnMode ? 'text-base' : 'text-lg')}>
              {columnMode && podcast.thumbnail && <img className={'object-cover w-6 h-6 rounded'} src={podcast.thumbnail} />}
              {podcast.name}
            </div>
            <div className={'transparent-font ellipsis-font-2 text-sm'}>{podcast.description}</div>
            <div className={'transparent-font text-sm flex gap-x-3 mt-0.5 flex-wrap gap-y-1'}>
              {podcast.followedAt && (
                <span>
                  {t('podcast.Follow time')}: {formatReleaseDate(podcast.followedAt)}
                </span>
              )}
              {podcast.lastUpdated && (
                <span>
                  {t('podcast.Update time')}: {formatReleaseDate(podcast.lastUpdated)}
                </span>
              )}
              {podcast.viewAt && (
                <span>
                  {t('podcast.View time')}: {formatReleaseDate(podcast.viewAt)}
                </span>
              )}
            </div>
          </div>
          <IconWithPopover
            name={Icons.More}
            placement={['right', 'left']}
            align={'start'}
            content={setV => <PodcastMenu parentFolderId={parentFolderId} onClose={() => setV(false)} type={'podcast'} id={podcast.id} />}
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

const EpisodeItem = ({
  id,
  onClick,
  columnMode,
  className,
  metaMode = false,
  parentFolderId
}: {
  id: number
  onClick?: VoidFunction
  columnMode?: boolean
  className?: string
  metaMode?: boolean
  parentFolderId?: number
}) => {
  const episode = ObjectStore('episode').useValue(id)
  if (!episode) return null
  const { releaseDate, duration, thumbnail, description, name } = episode
  return (
    <ContextMenu content={setV => <PodcastMenu parentFolderId={parentFolderId} id={id} type={'episode'} onClose={() => setV(false)} />}>
      <div
        className={classnames(
          'border shrink-0 light-hover relative transition-colors rounded-xl overflow-hidden flex items-center cursor-pointer',
          className
        )}
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
        <div className={classnames('flex w-full items-center gap-4', columnMode ? 'p-3' : 'px-4')}>
          <div className={classnames('flex w-full flex-col', columnMode ? 'gap-1.5' : 'pr-12')}>
            <div className={'transparent-font font-semibold gap-1 flex text-xs'}>
              <span>{formatReleaseDate(releaseDate)}</span>
              <span>·</span>
              <span>{formatEpisodeDuration(duration)}</span>
            </div>
            <div className={classnames('items-center gap-2 flex font-medium', columnMode ? '' : 'font-size-15')}>
              {columnMode && episode.thumbnail && <img className={'object-cover w-6 h-6 rounded'} src={thumbnail} />}
              <span className={classnames('line-clamp-1')}>{name}</span>
            </div>
            <div className={'line-clamp-2 break-all font-size-12'}>{description}</div>
          </div>
          <IconWithPopover
            name={Icons.More}
            placement={['right', 'left']}
            align={'start'}
            content={setV => <PodcastMenu parentFolderId={parentFolderId} onClose={() => setV(false)} type={'episode'} id={episode.id} />}
            containerClassName={'absolute top-3 right-3'}
            onClick={e => e.stopPropagation()}
            className={'hover-active-button'}
          ></IconWithPopover>
        </div>
      </div>
    </ContextMenu>
  )
}
