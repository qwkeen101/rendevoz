import { memo, useEffect, useRef, useState } from 'react'
import usePodcastState from '@/core/components/podcast/hooks/usePodcastState'
import Audio from '@/core/components/media/wrappers/Audio'
import EpisodeHeaderExtra from '@/core/components/podcast/EpisodeHeaderExtra'
import { ObjectStore } from '@/api/stores'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import { useParams } from 'react-router-dom'
import { IMediaInstance } from '~/typings'
import EpisodeServices from '@/core/components/podcast/services/episodeServices'
import { EmptyList, getImageMainColor, ImageWithBlur } from '../..'
import { Colors, Icons } from '@/consts'
import { Icon, IconWithPopover } from '@/components'
import useRenderGradientBg from '../../common/useRenderGradientBg'
import classNames from 'classnames'

export default memo(() => {
  const { id: paramsId } = useParams()
  const id = paramsId ? Number(paramsId) : undefined
  const episode = ObjectStore('episode').useValue(id)
  const podcastState = usePodcastState()[0]
  const podcast = ObjectStore('podcast').useValue(episode?.podcastId)
  const instance = usePodcastInstance()
  const playlist = usePodcastData().playlist
  const mediaInstance = useRef<IMediaInstance>()
  instance.getCurrentAudioInstance = () => {
    return mediaInstance.current
  }
  const [color, setColor] = useState('')
  const isPlaying = podcastState.isPlaying && playlist.current === id
  useEffect(() => {
    if (episode && !episode.description && episode.itunesURL) {
      const url = episode.itunesURL
      EpisodeServices.getEpisodeDetailsByURL(url).then(details => {
        if (details) {
          ObjectStore('episode').updateOne({
            id,
            enclosureURL: details.assetUrl,
            releaseDate: new Date(details.releaseDateTime).getTime(),
            duration: details.duration,
            description: details.description
          })
        }
      })
    }
  }, [episode?.id])
  const { renderMain, renderSub, mainHeight } = useRenderGradientBg(color)
  if (!episode) return <EmptyList />

  return (
    <div className={'@container w-full flex flex-col min-h-full'}>
      <div
        style={{ minHeight: 'clamp(186px,186px + (100cqw - 600px)/424*90,246px)', transform: 'translateZ(1px)' }}
        className='w-full relative flex p-8 gap-10 items-end'
      >
        {renderMain()}
        {episode.thumbnail && (
          <img
            className='hidden'
            onLoad={e =>
              getImageMainColor(e.currentTarget, episode.thumbnail!).then(res => {
                if (res) {
                  setColor(res)
                }
              })
            }
            src={episode.thumbnail}
          />
        )}
        <div className='select-none' style={{ transform: 'translateZ(1px)' }}>
          <div>单集</div>
          <div className='text-5xl mt-3 font-bold'>{episode.name}</div>
          {podcast && (
            <div
              onClick={() => {
                instance.actionOps?.openPodcast(podcast.id)
              }}
              className='flex mt-5 cursor-pointer items-center gap-3'
            >
              <img className='size-7 rounded-md' src={podcast.thumbnail} />
              <div className='text-2xl hover:underline font-bold'>{podcast.name}</div>
            </div>
          )}
        </div>
      </div>
      <div className='relative flex-1 flex flex-col'>
        {renderSub()}
        <div
          style={{
            transform: 'translateZ(1px)'
          }}
          className='flex px-8 py-6 flex-col flex-1'
        >
          <div className='flex gap-8 items-center'>
            <Icon
              onClick={() => {
                if (isPlaying) {
                  instance.actionOps?.pause()
                } else {
                  instance.actionOps?.playEpisode(episode.id)
                }
              }}
              name={isPlaying ? 'park-pause' : 'park-play-one'}
              size={24}
              theme='filled'
              strokeWidth={8}
              className='reverse-theme hover:scale-110 transition-transform cursor-pointer p-3 rounded-full'
            />
            <Icon
              name='park-like'
              size={26}
              onClick={() => {
                instance.dataOps?.follow?.(episode.id, 'episode')
              }}
              theme={episode.followed ? 'filled' : undefined}
              strokeWidth={4}
              className={classNames(episode.followed ? 'text-red-500 cursor-pointer' : 'hover-active-button')}
            />
            <Icon name='park-plus' size={30} className='hover-active-button' />
            <IconWithPopover name={Icons.More} size={26} strokeWidth={4} className='hover-active-button' />
          </div>
          <div className='relative w-full flex-1 flex flex-col'>
            <Audio
              mediaState={{
                description: episode.description,
                url: episode.itunesURL,
                layout: {
                  episode: {
                    sidebar: true
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
