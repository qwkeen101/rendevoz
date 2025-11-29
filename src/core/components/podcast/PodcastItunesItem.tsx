import { IItunesPodcast } from '@/core/components/feed/utils/service/podcasts'
import { Content } from '@/components'
import { CSSProperties, memo } from 'react'
import classnames from 'classnames'
import formatEpisodeDuration from '@/core/components/feed/components/podcast/utils/formatEpisodeDuration'
import formatReleaseDate from '@/core/components/feed/components/podcast/utils/formatReleaseDate'

export default memo(
  ({
    item,
    style,
    columnMode = false,
    onClick,
    showReleaseAndDur = false,
    className = 'button !p-1.5 flex-shrink-0 w-fit overflow-hidden'
  }: {
    item: IItunesPodcast
    style?: CSSProperties
    columnMode?: boolean
    showReleaseAndDur?: boolean
    className?: string
    onClick?: VoidFunction
  }) => {
    const size = columnMode ? 160 : 80
    const replacedThumbnail = item.artworkUrl600 ?? item.artworkUrl100?.replace('100x100bb', '600x600bb')
    return (
      <Content
        style={style}
        onClick={onClick}
        column={columnMode}
        flex
        gap={columnMode ? 8 : 12}
        alignItems={columnMode ? 'flex-start' : 'center'}
        className={className}
      >
        {replacedThumbnail && <img className={'rounded-md shadow object-cover'} width={size} height={size} src={replacedThumbnail} />}
        <Content
          flex
          column
          style={{
            maxWidth: columnMode ? size : undefined
          }}
        >
          <div className={classnames('ellipsis-font-2')}>{item.name || item.trackName}</div>
          <div className={'transparent-font flex text-sm whitespace-nowrap line-clamp-1'}>
            <span>{item.artistName ?? item.collectionName}</span>
            {item.trackCount ? <span> · {item.trackCount} episodes</span> : null}
            {showReleaseAndDur && <span>{item.releaseDate ? <span> · {formatReleaseDate(item.releaseDate, true)}</span> : null}</span>}
          </div>
          {item.kind === 'podcast-episode' && item.description && <div className={'text-sm ellipsis-font-2 mt-1'}>{item.description}</div>}
        </Content>
      </Content>
    )
  }
)
