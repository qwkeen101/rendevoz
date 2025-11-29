import { createMemoryRouter, Outlet, useLocation, useParams } from 'react-router-dom'
import PodcastLoadingPage from '@/core/components/podcast/routers/PodcastLoadingPage'
import PodcastSearch from '@/core/components/podcast/routers/PodcastSearch'
import EpisodeHistory from '@/core/components/podcast/routers/EpisodeHistory'
import PodcastHot from '@/core/components/podcast/routers/PodcastHot'
import EpisodeHot from '@/core/components/podcast/routers/EpisodeHot'
import PodcastFolder from '@/core/components/podcast/routers/PodcastFolder'
import PodcastLibrary from '@/core/components/podcast/components/PodcastLibrary'
import PodcastWithEpisodeList from '@/core/components/podcast/routers/PodcastPage'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import { useNorepeatNavigate, useUpdateEffect } from '@/hooks'
import { useEffect, useRef } from 'react'
import { useElementScrollRestore } from '@/components'
import usePodcastState from '@/core/components/podcast/hooks/usePodcastState'
import { ObjectStore } from '@/api/stores'
import PodcastMediaController from '@/core/components/podcast/routers/PodcastMediaController'
import CommonLayoutWrapper from '@/core/components/common/CommonLayoutWrapper'
import PodcastHeaderBar from '@/core/components/podcast/components/PodcastHeaderBar'
import PodcastSidebar from '@/core/components/podcast/components/PodcastSidebar'
import PodcastDashboard from '@/core/components/podcast/routers/PodcastDashboard'
import PodcastConsts from '@/core/components/podcast/PodcastConsts'
import EpisodeViewer from '@/core/components/podcast/routers/EpisodePage'
import GlobalEpisodeViewer from '@/core/components/podcast/GlobalEpisodeViewer'
import PodcastRightPanel from '../components/PodcastRightPanel'

const Container = () => {
  const data = usePodcastData()
  const instance = usePodcastInstance()
  const location = useLocation()
  const params = useParams()
  const navigate = useNorepeatNavigate()
  const ref = useRef<HTMLDivElement>(null)
  useElementScrollRestore({
    elementRef: ref,
    elementKey: 'podast_page'
  })
  instance.scrollElementRef = ref
  instance.navigate = navigate
  instance.getCurrentLocation = () => {
    return { ...location, params }
  }
  useEffect(() => {
    usePodcastState.apis.fetchHotAndEpisodes()
    ObjectStore('podcastFolder').getAll()
  }, [])
  useUpdateEffect(() => {
    usePodcastData.updateData(c => ({ ...c, dashboard: undefined }))
    usePodcastState.apis.fetchHotAndEpisodes()
  }, [data.country])
  const bodyRef = useRef<HTMLDivElement>(null)
  instance.bodyRef = bodyRef
  return (
    <>
      <CommonLayoutWrapper
        bottom={<PodcastMediaController />}
        header={<PodcastHeaderBar />}
        children={<Outlet />}
        bodyRef={bodyRef}
        scrollElementRef={ref}
        sidebar={<PodcastSidebar />}
      />
      <GlobalEpisodeViewer />
    </>
  )
}
export default createMemoryRouter(
  [
    {
      element: <Container />,
      path: '/',
      children: [
        {
          index: true,
          element: <PodcastDashboard />
        },
        {
          path: PodcastConsts.Routers.Loading,
          element: <PodcastLoadingPage />
        },
        {
          path: PodcastConsts.Routers.Search,
          element: <PodcastSearch />
        },
        { path: PodcastConsts.Routers.History, element: <EpisodeHistory /> },
        {
          path: 'hot/podcastList',
          element: <PodcastHot />
        },
        {
          path: 'hot/episodeList',
          element: <EpisodeHot />
        },
        {
          path: 'folder/:id',
          element: <PodcastFolder />
        },
        {
          path: PodcastConsts.Routers.Library,
          element: <PodcastLibrary />
        },
        {
          path: 'podcast/:id',
          element: <PodcastWithEpisodeList />
        },
        {
          path: 'episode/:id',

          element: <EpisodeViewer />
        }
      ]
    }
  ],
  {
    initialEntries: ['/']
  }
)
