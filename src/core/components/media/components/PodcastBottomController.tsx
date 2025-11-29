import useMediaState from '@/core/components/media/hooks/useMediaState'
import { Content, Icon, IconWithPopover } from '@/components'
import classnames from 'classnames'
import { memo, useRef, useState } from 'react'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import AudioPlayer from '@/core/components/media/players/AudioPlayer'
import { ObjectStore } from '@/api/stores'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import useRenderMediaControlBar from '@/core/components/media/useRenderMediaControlBar'
import usePodcastState from '../../podcast/hooks/usePodcastState'

export default memo(() => {
  const [mediaState, setMediaState] = useMediaState()
  const { thumbnail, name, paused } = mediaState
  const instance = useMediaInstance()
  const podcast = ObjectStore('podcast').useValue(mediaState.state?.podcastId)
  const containerRef = useRef<HTMLDivElement>(null)
  instance.getFloatBarElement = () => {
    const ele = containerRef.current
    return ele?.querySelector('#bottom-bar') ?? ele?.querySelector('#control-bar') ?? ele ?? undefined
  }
  const podcastInstance = usePodcastInstance()
  const setPodcastState = usePodcastState()[1]
  const {
    renderPrevButton,
    renderNextButton,
    renderVolume,
    renderSpeed,
    renderCurrentTime,
    renderTotalTime,
    renderPlayButton,
    renderController
  } = useRenderMediaControlBar()
  const BUTTON_CLASS = 'opacity-70 hover:opacity-100 cursor-pointer transition-opacity'
  return (
    <>
      <AudioPlayer coreMode />
      <div ref={containerRef} id={'control-bar'} className={'flex p-4 pt-1 gap-3 w-full justify-between items-center'}>
        <div className={'flex gap-4 flex-1 items-center'}>
          {thumbnail && (
            <img draggable={false} width={64} height={64} className={classnames('rounded-md size-16 cursor-pointer')} src={thumbnail} />
          )}
          <div>
            <div
              onClick={() => {
                const id = mediaState.state?.episodeId
                if (id) {
                  podcastInstance.actionOps?.openEpisode(id)
                }
              }}
              className={'font-size-13 cursor-pointer line-clamp-1'}
            >
              {name}
            </div>
            <div
              onClick={() => {
                const id = mediaState.state?.podcastId
                if (id) {
                  podcastInstance.actionOps?.openPodcast(id)
                }
              }}
              className={'transparent-font w-fit font-size-12 hover-primary-color transition-colors cursor-pointer'}
            >
              {podcast?.name}
            </div>
          </div>
        </div>
        <div className={'flex flex-col gap-2 items-center flex-1 shrink-0'}>
          <div className={'flex gap-6 items-center'}>
            <Icon
              onClick={() =>
                instance.insertLabel?.({
                  time: mediaState.currentTime
                })
              }
              name={'park-edit'}
              theme='filled'
              className={BUTTON_CLASS}
              size={20}
            />
            {renderPrevButton({
              className: BUTTON_CLASS,
              size: 24
            })}
            {renderPlayButton({
              spin: false,
              size: 20,
              className: 'hover:scale-105 z-[100] transition-transform reverse-theme rounded-full p-2 cursor-pointer'
            })}
            {renderNextButton({
              className: BUTTON_CLASS,
              size: 24
            })}
            {renderSpeed({
              className: BUTTON_CLASS,
              size: 20
            })}
          </div>
          <div className={'flex gap-4 items-center select-none'}>
            {renderCurrentTime()}
            {renderController({
              width: 360,
              loadBg: 'rgba(255, 255, 255)',
              progressStyle: {
                borderRadius: 999
              }
            })}
            {renderTotalTime()}
          </div>
        </div>
        <div className={'items-center justify-end flex gap-6 pr-3 flex-1'}>
          <Icon
            onClick={() => {
              const id = mediaState.state?.episodeId
              if (id) {
                podcastInstance.actionOps?.focusEpisode(id)
              }
            }}
            name='park-extend'
            className={BUTTON_CLASS}
            size={20}
          />
          <Icon
            onClick={() => {
              setPodcastState(s => ({
                ...s,
                rightbarVisible: s.rightbarActive === 'playlist' ? !s.rightbarVisible : true,
                rightbarActive: 'playlist'
              }))
            }}
            name='park-music-list'
            className={BUTTON_CLASS}
            size={20}
          />
          {renderVolume({
            iconClassname: BUTTON_CLASS,
            iconSize: 20,
            style: {
              gap: 10
            },
            width: 80
          })}
        </div>
      </div>
    </>
  )
})
