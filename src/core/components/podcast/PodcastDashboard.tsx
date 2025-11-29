import usePodcastState from '@/core/components/feed/components/podcast/usePodcastState'
import { useEffect, useRef } from 'react'
import { Content, Icon, useElementScrollRestore } from '@/components'
import PodcastItem from '@/core/components/feed/components/podcast/PodcastItunesItem'
import { IItunesPodcast } from '@/core/components/feed/utils/service/podcasts'
import { chunk } from 'lodash'
import PodcastEpisodes from '@/core/components/feed/components/podcast/EpisodeHot'
import PodcastWithEpisodeList from '@/core/components/feed/components/podcast/PodcastWithEpisodeList'
import EpisodePlayer from '@/core/components/feed/components/podcast/EpisodePlayer'
import usePodcastInstance, { useAssignPodcastInstance } from '@/core/components/feed/components/podcast/usePodcastInstance'
import PodcastMediaController from '@/core/components/feed/components/podcast/PodcastMediaController'
import PodcastSearch from '@/core/components/feed/components/podcast/PodcastSearch'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import PodcastHeaderBar from '@/core/components/feed/components/podcast/PodcastHeaderBar'
import { RouterProvider, createMemoryRouter, Outlet, useNavigate } from 'react-router-dom'
import PodcastLibrary from '@/core/components/feed/components/podcast/components/PodcastLibrary'
import EpisodeHot from '@/core/components/feed/components/podcast/EpisodeHot'
import PodcastHot from '@/core/components/feed/components/podcast/PodcastHot'
import useNorepeatNavigate from '@/core/components/feed/components/podcast/useNorepeatNavigate'
import PodcastSearchInput from '@/core/components/feed/components/podcast/components/PodcastSearchInput'
import EpisodePlaylist from '@/core/components/feed/components/podcast/EpisodePlaylist'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'
const Dashboard = () => {
  const navigate = useNorepeatNavigate()
  const dashboard = usePodcastData().dashboard
  const instance = usePodcastInstance()
  const [search, setSearch] = PodcastSearch.usePodcastSearch()
  const scrollContainer = (
    items: IItunesPodcast[],
    max = 30,
    opts?: {
      onClick?: (i: IItunesPodcast) => void
      column?: boolean
      width?: string
      maxWidth?: string
      rows?: number
    }
  ) => {
    const chunked = chunk(items.slice(0, max), opts?.rows ?? 1)
    return (
      <Content className={'no-scrollbar flex min-w-full overflow-x-auto gap-2 -mr-6 pr-6 snap-x shrink-0 snap-mandatory'}>
        {chunked.map(i => (
          <Content flex column key={i[0].id} className={'flex-shrink-0 gap-1 w-fit snap-start'}>
            {i.map(o => (
              <PodcastItem
                onClick={() => opts?.onClick?.(o)}
                columnMode={opts?.column}
                style={{
                  width: opts?.width,
                  maxWidth: opts?.maxWidth
                }}
                item={o}
                key={o.id}
              />
            ))}
          </Content>
        ))}
      </Content>
    )
  }
  const containerRef = useRef<HTMLElement>(null)
  useElementScrollRestore({
    elementRef: containerRef,
    elementKey: 'podcast-dashboard'
  })
  return (
    <Content ref={containerRef} className={'py-6 px-[1.125rem] overflow-x-hidden overflow-y-auto grow shrink pb-40'} fullWidth column flex>
      <PodcastSearchInput
        className={'pl-1.5'}
        value={search.query}
        onSubmit={() => {
          PodcastSearch.searchResults()
          navigate('search')
        }}
        onChange={s => setSearch(o => ({ ...o, query: s }))}
      />
      <EpisodePlaylist />
      <div
        className={'group w-fit text-2xl flex items-center mt-4 pl-1.5 mb-2.5 cursor-pointer gap-2'}
        onClick={() => {
          navigate('/podcastList')
        }}
      >
        <div>Podcasts</div>
        <Icon name={'park-right'} className={'transition-transform group-hover:translate-x-1'} />
      </div>
      {scrollContainer(dashboard?.hot || [], 30, {
        column: true,
        rows: 1,
        onClick: async i => {
          const p = await instance.actionOps?.addItunesPodcast?.(i)
          if (p) {
            navigate(`podcast/${p.id}`)
          }
        }
      })}
      <div
        className={'group w-fit text-2xl flex items-center pl-1.5 mt-4 mb-2.5 gap-2 cursor-pointer'}
        onClick={() => {
          navigate('/episodeList')
        }}
      >
        <div>Episodes</div>
        <Icon name={'park-right'} className={'transition-transform group-hover:translate-x-1'} />
      </div>
      {scrollContainer(dashboard?.episodes || [], 30, {
        width: '80vw',
        maxWidth: '36rem',
        rows: 3,
        onClick: i => {
          instance.actionOps?.addItunesEpisode?.(i).then(e => {
            if (e) {
              navigate(`/episode/${e.id}`)
            }
          })
        }
      })}
    </Content>
  )
}
const Main = () => {
  useEffect(() => {
    usePodcastState.apis.fetchHotAndEpisodes()
  }, [])
  useAssignPodcastInstance()
  return (
    <div className={'flex-col flex w-full h-full'}>
      <PodcastHeaderBar />
      <PodcastMediaController />
      <Outlet />
    </div>
  )
}
const router = createMemoryRouter(
  [
    {
      element: <Main />,
      path: '/',
      children: [
        {
          index: true,
          element: <Dashboard />
        },
        {
          path: 'search',
          element: <PodcastSearch />
        },
        {
          path: 'episode/:id',
          element: <EpisodePlayer />
        },
        {
          path: 'podcastList',
          element: <PodcastHot />
        },
        {
          path: 'episodeList',
          element: <EpisodeHot />
        },
        {
          path: 'library',
          element: <PodcastLibrary />,
          children: [
            {
              path: 'podcast'
            },
            {
              path: 'episode'
            }
          ]
        },
        {
          path: 'podcast/:id',
          element: <PodcastWithEpisodeList />
        }
      ]
    }
  ],
  {
    initialEntries: ['/']
  }
)
export default () => {
  return <RouterProvider router={router}></RouterProvider>
}
