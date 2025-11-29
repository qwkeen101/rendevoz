import { IItunesPodcast } from '@/core/components/podcast/services/podcasts'
import { Content, Icon } from '@/components'
import { CSSProperties, memo } from 'react'
import classnames from 'classnames'
import formatEpisodeDuration from '@/core/components/podcast/utils/formatEpisodeDuration'
import formatReleaseDate from '@/core/components/podcast/utils/formatReleaseDate'
import { useTranslation } from 'react-i18next'
import ImageTitleItem from '@/core/components/common/ImageTitleItem'

export default memo(
  ({
    detailsMode,
    item,
    style,
    columnMode = false,
    onClick,
    showReleaseAndDur = false,
    columnSize = '!w-52 !h-52',
    skeleton,
    play,
    className = detailsMode === true ? undefined : 'cursor-pointer group flex-shrink-0 w-fit overflow-hidden'
  }: {
    item: IItunesPodcast
    style?: CSSProperties
    skeleton?: boolean
    columnMode?: boolean
    showReleaseAndDur?: boolean
    columnSize?: string
    play?: VoidFunction
    className?: string
    detailsMode?: boolean
    onClick?: VoidFunction
  }) => {
    const { t } = useTranslation()
    const size = columnMode ? 160 : 80
    const replacedThumbnail = item.artworkUrl600 ?? item.artworkUrl100?.replace('100x100bb', '600x600bb')
    if (skeleton) {
      return (
        <Content
          style={style}
          onClick={onClick}
          column={columnMode}
          flex
          gap={columnMode ? 8 : 12}
          alignItems={columnMode ? 'flex-start' : 'center'}
          className={classnames(className, 'animate-pulse')}
        >
          <div className={'rounded-md shrink-0 bg-secondary'} style={{ width: size, height: size }} />
          <div
            className={'gap-1 flex flex-col w-full'}
            style={{
              maxWidth: columnMode ? size : undefined
            }}
          >
            <div style={{ width: 'min(16rem, 100%)' }} className={'h-2 rounded bg-secondary'}></div>
            <div className={'h-2 rounded bg-secondary'}></div>
          </div>
        </Content>
      )
    }
    if (columnMode) {
      return (
        <ImageTitleItem
          titleStyle={{ fontSize: '1rem' }}
          className={columnSize}
          id={item.id}
          onClick={onClick}
          aboveTitle={item.artistName && <div className={'text-white line-clamp-1 font-size-12'}>{item.artistName}</div>}
          description={item.description}
          imageStyle={{ aspectRatio: '1' }}
          image={replacedThumbnail}
          title={item.name || item.trackName}
        />
      )
    }
    if (detailsMode) {
      return (
        <div
          style={style}
          onClick={onClick}
          className={classnames('flex select-none group cursor-default p-3 light-hover items-start gap-4', className)}
        >
          {replacedThumbnail && (
            <div className='relative shadow rounded-md shrink-0' style={{ width: 110, height: 110 }}>
              <img className={'rounded-md object-cover size-full'} src={replacedThumbnail} />
              {play && (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <Icon
                    name='park-play-one'
                    style={{
                      color: 'white'
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      play?.()
                    }}
                    strokeWidth={6}
                    theme='filled'
                    size={32}
                    className='group-hover:opacity-100 backdrop-blur-xl bg-opacity-20 hover:bg-opacity-70 bg-black cursor-pointer p-3 rounded-full transition-all opacity-0'
                  />
                </div>
              )}
            </div>
          )}
          <div>
            <div className={'line-clamp-2 font-size-16'}>{item.name || item.trackName}</div>
            <div className={'transparent-font mt-0.5'}>{item.artistName ?? item.collectionName}</div>
            {item.description && <div className='line-clamp-2 mt-2'>{item.description}</div>}
            <div className='mt-2'>
              <span>{DateFormat.formatDate(item.releaseDate!)}</span>
              <span> • </span>
              <span>{formatEpisodeDuration(item.trackTimeMillis! / 1000)}</span>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div style={style} onClick={onClick} className={classnames('flex items-center gap-4', className)}>
        {replacedThumbnail && (
          <img className={'rounded-md shadow object-cover shrink-0'} style={{ width: size, height: size }} src={replacedThumbnail} />
        )}
        <Content
          flex
          column
          style={{
            maxWidth: columnMode ? size : undefined
          }}
        >
          <div className={classnames('line-clamp-2 group-hover:underline font-medium')}>{item.name || item.trackName}</div>
          <div className={'transparent-font break-all mt-0.5 flex text-sm gap-1 whitespace-nowrap line-clamp-1'}>
            <span>{item.artistName ?? item.collectionName}</span>
            {item.trackCount ? (
              <>
                <span>·</span>
                <span className={'lowercase'}>
                  {item.trackCount} {t('podcast.Episodes')}
                </span>
              </>
            ) : null}
            {showReleaseAndDur && item.releaseDate && (
              <>
                <span>·</span>
                <span>{formatReleaseDate(item.releaseDate, true)}</span>
              </>
            )}
          </div>
        </Content>
      </div>
    )
  }
)
