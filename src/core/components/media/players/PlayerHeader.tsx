import { useSelectMediaState } from '@/core/components/media/hooks/useMediaState'
import classnames from 'classnames'
import formatEpisodeDuration from '@/core/components/podcast/utils/formatEpisodeDuration'
import MediaBottomBar from '@/core/components/media/MediaBottomBar'
import { Colors } from '@/consts'
import { memo, useRef } from 'react'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import EpisodeHeaderExtra from '@/core/components/podcast/EpisodeHeaderExtra'
import formatReleaseDate from '@/core/components/podcast/utils/formatReleaseDate'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import useRenderMediaControlBar from '../useRenderMediaControlBar'

export default memo(() => {
  const { thumbnail, releaseDate, name, totalTime, layout, state, styles } = useSelectMediaState(s => ({
    thumbnail: s.thumbnail,
    releaseDate: s.releaseDate,
    name: s.name,
    totalTime: s.totalTime,
    layout: s.layout,
    state: s.state,
    styles: s.styles
  }))
  const episodeMode = layout?.episodeMode
  const bottomBarRef = useRef<HTMLDivElement>(null)
  const instance = useMediaInstance()
  const { t } = useTranslation()
  const { renderController, renderTotalTime, renderCurrentTime, renderPlayButton, renderVolume } = useRenderMediaControlBar()
  if (episodeMode) {
    return (
      <div className={classnames(`flex flex-col items-center gap-y-4 w-full @4xl:multi-[flex-row;gap-x-8]`, styles?.playerHeaderClassName)}>
        <div
          className={classnames(
            'gap-3.5 flex flex-col w-full items-center grow @4xl:items-start',
            styles?.playerHeaderNameContainerClassName
          )}
        >
          {(releaseDate || totalTime) && episodeMode ? (
            <div className={'flex font-medium gap-1 small-transparent leading-none'}>
              {releaseDate && <span>{formatReleaseDate(releaseDate)}</span>}
              {totalTime && (
                <>
                  <span>·</span>
                  <span>{formatEpisodeDuration(totalTime)}</span>
                </>
              )}
            </div>
          ) : null}
          <div className={classnames('font-bold line-clamp-3 text-3xl', !name && 'super-transparent-font')}>{name || t(trans.Unnamed)}</div>
          {layout?.audioHeaderExtra}
        </div>
      </div>
    )
  }
  if (!episodeMode) {
    instance.getMediaContainer = () => {
      return (bottomBarRef.current?.firstElementChild as HTMLElement | undefined) || undefined
    }
  }
  return (
    <>
      <div className={classnames(`flex flex-col items-center gap-y-4 w-full @4xl:multi-[flex-row;gap-x-8]`, styles?.playerHeaderClassName)}>
        {thumbnail && !layout?.smallAudioThumbnail && (
          <img className={'rounded-xl shrink-0 w-40 h-40 @4xl:w-48 @4xl:h-48 object-cover'} src={thumbnail} />
        )}
        <div
          className={classnames(
            'gap-3.5 flex flex-col w-full items-center grow @4xl:items-start',
            styles?.playerHeaderNameContainerClassName
          )}
        >
          {layout?.smallAudioThumbnail && thumbnail ? (
            <div className={'w-full flex gap-4 items-center'}>
              <img className={'rounded shadow w-10 h-10 object-cover'} src={thumbnail} />
              <div className={classnames('font-semibold text-lg line-clamp-1 break-all')}>{name}</div>
            </div>
          ) : (
            <div
              className={classnames(
                'font-bold text-center line-clamp-3 break-all text-xl @4xl:multi-[line-clamp-2;text-start;text-2xl]',
                !name && 'super-transparent-font'
              )}
            >
              {name || t(trans.Unnamed)}
            </div>
          )}
          {layout?.audioHeaderExtra}
          {state?.episodeId && layout?.audioPodcast !== false && <EpisodeHeaderExtra id={state.episodeId} />}
          <div className={'mt-2 w-full'} ref={bottomBarRef}>
            <div className='flex justify-between mb-2'>
              {renderCurrentTime()}
              {renderTotalTime()}
            </div>
            {renderController()}
            <div className='flex items-center gap-6 mt-4'>
              {renderPlayButton({
                className: 'cursor-pointer',
                spin: false,
                size: 20
              })}
              {renderVolume({
                iconClassname: 'cursor-pointer',
                iconSize: 18
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
})
