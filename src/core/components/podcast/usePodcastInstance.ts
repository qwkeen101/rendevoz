import { IEpisode, IPodcast } from '@/core/components/feed/components/podcast/types'
import { atom } from 'jotai'
import { useGlobalAtomValue } from '@/hooks'
import { IItunesPodcast } from '@/core/components/feed/utils/service/podcasts'
import { assignProperties } from '@/utils'
import { ObjectStore } from '@/api/stores'
import PodcastServices from '@/core/components/feed/components/podcast/services/podcastServices'
import EpisodeServices from '@/core/components/feed/components/podcast/services/episodeServices'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'
import useNorepeatNavigate from '@/core/components/feed/components/podcast/useNorepeatNavigate'

export type IPodcastInstance = Partial<{
  actionOps: Partial<{
    open: any
    jumpToEpisodeTime: (episode: number, time: number) => void
    playEpisode: (episode: number | IEpisode) => void
    pause: VoidFunction
    queueEpisode: (id: number) => void
    addItunesPodcast: (p: IItunesPodcast) => Promise<IPodcast>
    addItunesEpisode: (p: IItunesPodcast) => Promise<IEpisode | undefined>
    openItunesPodcast: (p: IItunesPodcast) => Promise<void>
    openItunesEpisode: (p: IItunesPodcast) => Promise<void>
  }>
  dataOps: Partial<{
    follow: (id: number, type: 'podcast' | 'episode') => Promise<void>
    star: (id: number, type: 'podcast' | 'episode') => Promise<void>
  }>
}>

const podcastInstanceAtom = atom<IPodcastInstance>({})
export default () => useGlobalAtomValue(podcastInstanceAtom)

const transform100To600Pic = (str: string) => {
  return str.replace('100x100', '600x600')
}
export const useAssignPodcastInstance = () => {
  const navigate = useNorepeatNavigate()
  const instance = useGlobalAtomValue(podcastInstanceAtom)
  assignProperties(instance, {
    actionOps: {
      ...instance.actionOps,
      addItunesEpisode: async p => {
        const cached = await ObjectStore('episode').fetchAll()
        const target = cached.find(i => i.itunesId === (p.id ?? p.trackId))
        if (!target) {
          const podcastId = p.collectionId ?? EpisodeServices.getPodcastIdByURL(p.url ?? p.trackViewUrl)
          if (!podcastId) return
          const pod = await PodcastServices.getPodcastInfo(Number(podcastId))
          if (pod) {
            const res = await instance.actionOps?.addItunesPodcast?.(pod)
            if (res) {
              const added = await ObjectStore('episode').addOne({
                name: p.name ?? p.trackName,
                thumbnail: p.artworkUrl600 ?? (p.artworkUrl100 ? transform100To600Pic(p.artworkUrl100) : undefined),
                itunesId: p.id ?? p.trackId,
                itunesURL: p.url ?? p.trackViewUrl,
                description: p.description,
                genres: p.genres,
                podcastId: res.id,
                releaseDate: p.releaseDate ? new Date(p.releaseDate).getTime() : undefined
              })
              return added
            }
          }
        } else {
          return target
        }
      },
      addItunesPodcast: async p => {
        const cached = await ObjectStore('podcast').fetchAll()
        const target = cached.find(i => i.itunesId === (p.id ?? p.trackId))
        if (!target) {
          const added = await ObjectStore('podcast').addOne({
            name: p.name ?? p.trackName,
            artist: p.artistName,
            thumbnail: p.artworkUrl600 ?? (p.artworkUrl100 ? transform100To600Pic(p.artworkUrl100) : undefined),
            episodes: [],
            itunesId: p.id ?? p.trackId,
            itunesURL: p.url ?? p.trackViewUrl,
            country: 'cn'
          })
          return added
        } else {
          return target
        }
      },
      openItunesEpisode: async p => {
        const e = await instance.actionOps?.addItunesEpisode?.(p)
        if (e) {
          navigate(`/episode/${e.id}`)
        }
      },
      openItunesPodcast: async p => {
        const e = await instance.actionOps?.addItunesPodcast?.(p)
        if (e) {
          navigate(`/podcast/${e.id}`)
        }
      }
    },
    dataOps: {
      ...instance.dataOps,
      star: async (id, type) => {
        const curr = await ObjectStore(type).getOneById(id)
        console.log(curr)
        if (curr) {
          if (curr.starred) {
            await ObjectStore(type).updateOne({ id, starred: false })
            return
          } else {
            if (!curr.followed) {
              await instance.dataOps?.follow?.(id, type)
            }
            await ObjectStore(type).updateOne({ id, starred: true })
          }
        }
      },
      follow: async (id, type) => {
        const name = type === 'podcast' ? 'followedPodcasts' : 'followedEpisodes'
        const curr = await ObjectStore(type).getOneById(id)
        const arr = usePodcastData.getData()[name]
        if (curr) {
          if (curr.followed) {
            await usePodcastData.updateData(curr => ({ ...curr, [name]: arr.filter(o => o !== id) }))
            await ObjectStore(type).updateOne({ id, followed: false, followedAt: undefined })
          } else {
            await usePodcastData.updateData(curr => ({ ...curr, [name]: [id, ...arr.filter(o => o !== id)] }))
            await ObjectStore(type).updateOne({ id, followed: true, followedAt: Date.now() })
          }
        }
      }
    }
  })
}
