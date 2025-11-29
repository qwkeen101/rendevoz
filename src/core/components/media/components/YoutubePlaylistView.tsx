import { memo, useEffect, useMemo, useRef, useState } from 'react'
import YoutubeServices, { IYoutubeVideoItem } from '@/core/components/youtube/YoutubeServices'
import { atom } from 'jotai'
import { useGlobalAtom } from '@/hooks'
import { ObjectStore } from '@/api/stores'
import { useSelectMediaState } from '@/core/components/media/hooks/useMediaState'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { DotLoading, Icon, Virtualizer, VirtualList } from '@/components'
import classnames from 'classnames'
import toast from 'react-hot-toast'
import { Icons } from '@/consts'
import { IYoutubeVideo } from '~/typings'
import NoResult from '@/core/components/common/NoResult'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'

const PlaylistToVideosCache = atom<Record<number, Partial<IYoutubeVideo>[]>>({})

const getAllVideos = async (id: string) => {
  const token = {
    current: undefined as string | undefined
  }
  let stop = false
  let results: IYoutubeVideoItem[] = []

  while (!stop) {
    const res = await YoutubeServices.getVideosOfPlaylist(id, { token: token.current, details: true })
    if (!res.token) {
      stop = true
    } else {
      token.current = res.token
    }
    results = [...results, ...res.items]
  }
  return results
}
export default memo(() => {
  const state = useSelectMediaState(s => s.state)
  const playlist = ObjectStore('youtubePlaylist').useValue(state?.ytPlaylistId)
  const channel = ObjectStore('youtubeChannel').useValue(state?.ytChannelId)
  const video = ObjectStore('youtubeVideo').useValue(state?.ytVideoId)
  const folder = ObjectStore('youtubeFolder').useValue(state?.ytFolderId)
  const [folderVideos, setFolderVideos] = useState<IYoutubeVideo[]>([])
  const [cache, setCache] = useGlobalAtom(PlaylistToVideosCache)
  const allVideos = state?.ytFolderId ? folderVideos : state?.ytPlaylistId ? cache[state?.ytPlaylistId] ?? [] : []
  const { count, index } = useMemo(() => {
    const currentVideoId = video?.videoId
    return {
      count: allVideos.length,
      index: currentVideoId ? allVideos.findIndex(i => i.videoId === currentVideoId) : undefined
    }
  }, [allVideos, video])
  useEffect(() => {
    if (folder) {
      ObjectStore('youtubeVideo')
        .getMultipleByIds(folder.items?.filter(i => i.type === 'video').map(i => i.id) ?? [])
        .then(res => {
          setFolderVideos(res)
        })
    }
  }, [folder])
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (playlist && !folder) {
      getAllVideos(playlist.playlistId)
        .then(res => {
          const videos = res.map(i => ({
            name: i.snippet.title,
            thumbnail: i.snippet.thumbnails.high.url,
            channelId: i.snippet.channelId,
            videoId: i.id,
            duration: YoutubeServices.iso8601DurationToSeconds(i.contentDetails?.duration)
          })) as Partial<IYoutubeVideo>[]
          setCache(s => ({ ...s, [playlist.id]: videos ?? [] }))
        })
        .catch(() => {
          setFailed(true)
          toast.error(t(trans.Errors.NetworkError))
        })
    }
  }, [playlist?.id])
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  const parentContainer = state?.ytFolderId ? folder : playlist
  useEffect(() => {
    if (index !== undefined && index >= 0) {
      virtualizerRef.current?.scrollToIndex(index, { align: 'center' })
    }
  }, [allVideos])
  const renderInner = () => {
    if (playlist && !folder && state?.ytPlaylistId && !cache[state?.ytPlaylistId]) {
      return (
        <div className={'w-full h-full flex items-center justify-center'}>
          <DotLoading />
        </div>
      )
    }
    if ((parentContainer && allVideos && allVideos.length === 0) || failed) {
      return <NoResult className={'h-full'} />
    }
    if (allVideos?.length && parentContainer) {
      return (
        <VirtualList
          estimateSize={73.5}
          items={allVideos}
          ref={virtualizerRef}
          paddingEnd={100}
          style={{
            width: '100%',
            height: '100%'
          }}
          renderItem={(i, idx) => (
            <div
              onClick={() => {
                Global.layoutOps?.openPage('youtube').then(ins => {
                  ins
                    .addVideo?.(i.videoId, {
                      history: true,
                      channelAppId: state?.ytChannelId,
                      playlistAppId: state?.ytPlaylistId
                    })
                    .then(res => {
                      ins.goTo?.(res.id, 'video', {
                        folderId: folder?.id
                      })
                    })
                })
              }}
              className={classnames('flex items-center button !rounded-none !py-1.5 !h-auto !pl-0 !pr-8', idx === index && 'active-button')}
            >
              <div className={'transparent-font font-size-12 w-8 flex justify-center shrink-0'}>{idx + 1}</div>
              <img className={'rounded-md w-32 aspect-video object-cover shrink-0'} src={i.thumbnail} />
              <div className={'flex flex-col gap-1 ml-3'}>
                <div className={'font-medium line-clamp-2 leading-snug font-size-13'}>{i.name}</div>
                {i.duration ? (
                  <div className={classnames('text-xs', idx === index ? 'select-color-font' : 'transparent-font')}>
                    {normalizeSecondsToTime(i.duration)}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        />
      )
    }
  }
  if (!parentContainer)
    return (
      <div className={'flex flex-col h-full'}>
        <NoResult />
      </div>
    )
  return (
    <div className={'flex flex-col w-full h-full'}>
      <div className={'flex w-full items-center px-4 py-3'}>
        <div className={'flex-1'}>
          <div
            onClick={() => {
              if (folder) {
                Global.layoutOps?.openPage('youtube').then(i => {
                  i.goTo?.(folder.id, 'folder')
                })
              } else if (playlist) {
                Global.layoutOps?.openPage('youtube').then(i => {
                  i.goTo?.(playlist.id, 'playlist')
                })
              }
            }}
            className={'font-bold w-fit text-lg line-clamp-1 cursor-pointer'}
          >
            {parentContainer.name}
          </div>
          <div
            className={'font-size-12 w-fit flex gap-1 transparent-font cursor-pointer'}
            onClick={() => {
              channel &&
                Global.layoutOps?.openPage('youtube').then(i => {
                  i.goTo?.(channel.id, 'channel', {
                    initializeChannel: true
                  })
                })
            }}
          >
            {channel?.name}
            <span>-</span>
            <span>
              {(index || 0) + 1} / {count}
            </span>
          </div>
        </div>
      </div>
      {renderInner()}
    </div>
  )
})
