import { IEpisode, IPodcast } from '@/core/components/podcast/types'
import { atom, useAtom } from 'jotai'
import { useGlobalAtomValue, useNorepeatNavigate } from '@/hooks'
import { IItunesPodcast } from '@/core/components/podcast/services/podcasts'
import { assignProperties } from '@/utils'
import { ObjectStore } from '@/api/stores'
import PodcastServices from '@/core/components/podcast/services/podcastServices'
import EpisodeServices from '@/core/components/podcast/services/episodeServices'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import getPodcastCountryCode from '@/core/components/podcast/utils/getPodcastCountryCode'
import { IFeedFolder, IMediaInstance } from '~/typings'
import usePodcastState from '@/core/components/podcast/hooks/usePodcastState'
import { Location } from 'react-router'
import { Params } from 'react-router-dom'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import updatePodcastInfo from '@/core/components/podcast/services/podcastServices'
import { RefObject } from 'react'

export type IPodcastInstance = Partial<{
  actionOps: {
    open: any
    load: (type: 'episode' | 'podcast', url: string) => void
    jumpToEpisodeTime: (episode: number, time: number) => void
    playEpisode: (episode: number | IEpisode) => void
    pause: VoidFunction
    openEpisode: (id: number) => void
    openPodcast: (id: number) => void
    openFolder: (id: number) => void
    queueEpisode: (id: number) => void
    addItunesPodcast: (url: string, loading?: boolean) => Promise<IPodcast>
    addItunesEpisode: (url: string) => Promise<IEpisode>
    focusEpisode: (id: number) => void
  }
  folderOps: {
    edit: (id: number) => void
    delete: (id: number) => Promise<void>
    createFolder: (currentFolder?: Partial<IFeedFolder>) => Promise<IFeedFolder>
  }
  changeSearchQuery: (q: string) => void
  search: (opts?: { limit?: number; type?: 'episode' | 'podcast' }) => Promise<void>
  navigate: ReturnType<typeof import('react-router-dom').useNavigate>
  dataOps: Partial<{
    follow: (id: number, type: 'podcast' | 'episode', shouldToast?: boolean) => Promise<void>
    star: (id: number, type: 'podcast' | 'episode') => Promise<void>
  }>
  getCurrentLocation: () => Location & { params: Params }
  getCurrentAudioInstance: () => IMediaInstance | undefined
}> & {
  searchAtom: typeof PodcastSearchAtom
  scrollElementRef: RefObject<HTMLDivElement>
  bodyRef: RefObject<HTMLDivElement>
}

const PodcastSearchAtom = atom<{
  query: string
  resultEpisodes?: IItunesPodcast[]
  resultPodcasts?: IItunesPodcast[]
  visibleTab: 'podcast' | 'episodes'
}>({
  query: '',
  visibleTab: 'podcast'
})
const podcastInstanceAtom = atom<IPodcastInstance>({})
export default () => useGlobalAtomValue(podcastInstanceAtom)

const transform100To600Pic = (str: string) => {
  return str.replace('100x100', '600x600')
}
export const useAssignPodcast = () => {
  const instance = useGlobalAtomValue(podcastInstanceAtom)
  const [state, setState] = usePodcastState()
  const { t } = useTranslation()
  const [searchState, setSearchState] = useAtom(PodcastSearchAtom)
  assignProperties(instance, {
    actionOps: {
      ...instance.actionOps,
      focusEpisode: id => {
        setState(s => ({ ...s, focusEpisode: id, isFocusing: true }))
      },
      load: (type, url) => {
        instance.navigate?.(`/loading?type=${type}&url=${url}`)
      },
      openEpisode: id => {
        instance.navigate?.(`/episode/${id}`)
      },
      openPodcast: async id => {
        const podcast = await ObjectStore('podcast').getOneById(id)
        if (podcast) {
          await ObjectStore('episode').getMultipleByIds(podcast.episodes)
          instance.navigate?.(`/podcast/${id}`)
        }
      },
      openFolder: id => {
        instance.navigate?.(`/folder/${id}`)
      },
      addItunesEpisode: async url => {
        const cached = await ObjectStore('episode').fetchByConditions({
          itunesURL: url
        })
        if (!cached.length) {
          try {
            const details = await EpisodeServices.getEpisodeDetailsByURL(url)
            if (!details) {
              throw 'Failed to fetch episode details!'
            }
            const added = await ObjectStore('episode').addOne({
              name: details.title,
              thumbnail: details.image,
              itunesURL: url,
              description: details.description,
              enclosureURL: details.assetUrl,
              duration: details.duration,
              releaseDate: new Date(details.releaseDateTime).getTime()
            })
            const res = await instance.actionOps?.addItunesPodcast?.(url, false)
            if (res) {
              await ObjectStore('episode').updateOne({ id: added.id, podcastId: res.id })
            }
            return added
          } catch (e) {
            console.log(e)
            toast.error(t(trans.Errors.NetworkError))
            return Promise.reject()
          }
        } else {
          return cached[0]
        }
      },
      addItunesPodcast: async url => {
        const podcastItunesId = EpisodeServices.getPodcastIdByURL(url)
        const cached = await ObjectStore('podcast').fetchByConditions({
          itunesId: podcastItunesId
        })
        if (!cached.length) {
          const details = await PodcastServices.getPodcastInfo(podcastItunesId)
          const added = await ObjectStore('podcast').addOne({
            name: details.name ?? details.trackName,
            artist: details.artistName,
            thumbnail: details.artworkUrl600 ?? (details.artworkUrl100 ? transform100To600Pic(details.artworkUrl100) : undefined),
            episodes: [],
            itunesId: podcastItunesId,
            itunesURL: details.url ?? details.trackViewUrl ?? url,
            country: getPodcastCountryCode(),
            lastUpdated: details.releaseDate ? new Date(details.releaseDate).getTime() : undefined
          })
          try {
            await updatePodcastInfo.fetchEpisodes(added.id)
            setTimeout(() => {
              updatePodcastInfo.fetchDescription(added.id)
            })
            return added
          } catch (e) {
            toast.error(t(trans.Errors.NetworkError))
            ObjectStore('podcast').deleteOneById(added.id)
            return Promise.reject()
          }
        } else {
          await ObjectStore('episode').getMultipleByIds(cached[0].episodes)
          return cached[0]
        }
      }
    },
    dataOps: {
      ...instance.dataOps,
      star: async (id, type) => {
        const curr = await ObjectStore(type).getOneById(id)
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
      follow: async (id, type, shouldToast = true) => {
        const name = type === 'podcast' ? 'followedPodcasts' : 'followedEpisodes'
        const curr = await ObjectStore(type).getOneById(id)
        const arr = usePodcastData.getData()[name]
        if (curr) {
          if (curr.followed) {
            await usePodcastData.updateData(curr => ({ ...curr, [name]: arr.filter(o => o !== id) }))
            await ObjectStore(type).updateOne({ id, followed: false, followedAt: undefined, starred: false })
          } else {
            await usePodcastData.updateData(curr => ({ ...curr, [name]: [id, ...arr.filter(o => o !== id)] }))
            await ObjectStore(type).updateOne({ id, followed: true, followedAt: Date.now() })
            shouldToast && toast.success(t(trans.Success.FollowedSuccessfully))
          }
        }
      }
    },
    folderOps: {
      delete: async id => {
        const folder = await ObjectStore('podcastFolder').fetchOneById(id)
        if (folder) {
          await ObjectStore('podcastFolder').deleteOneById(id)
          const currentLocation = instance.getCurrentLocation?.()
          if (currentLocation?.params.id === String(id)) {
            instance.navigate?.('/library', { replace: true })
          }
        }
      },
      edit: async id => {
        const folder = await ObjectStore('podcastFolder').fetchOneById(id)
        if (folder) {
          Global.dialogOps?.createOrEditFolder('podcastFolder', folder)
        }
      },
      createFolder: async c => {
        return await Global.dialogOps!.createOrEditFolder('podcastFolder', {
          podcasts: [],
          episodes: [],
          ...c
        })
      }
    },
    searchAtom: PodcastSearchAtom,
    changeSearchQuery: q => {
      setSearchState(s => ({ ...s, query: q }))
    },
    search: async (opts?: { limit?: number; type?: 'episode' | 'podcast' }) => {
      const q = searchState.query
      const limit = opts?.limit ?? 50
      await Promise.allSettled([
        opts?.type === 'episode'
          ? undefined
          : fetch(
              `https://itunes.apple.com/search?media=podcast&entity=podcast&term=${q}&limit=${limit}&country=${getPodcastCountryCode()}`
            )
              .then(res => res.json())
              .then(data => {
                setSearchState(s => ({ ...s, resultPodcasts: data.results }))
              }),
        opts?.type === 'podcast'
          ? undefined
          : fetch(
              `https://itunes.apple.com/search?media=podcast&entity=podcastEpisode&term=${q}&limit=${limit}&country=${getPodcastCountryCode()}`
            )
              .then(res => res.json())
              .then(data => {
                setSearchState(s => ({ ...s, resultEpisodes: data.results }))
              })
      ])
      instance.navigate?.('/search')
    }
  })
}
