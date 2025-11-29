import { createMemoryRouter, Outlet, useLocation, useParams } from 'react-router-dom'
import FeedLoadingPage from './FeedLoadingPage'
import FeedLibrary from '../components/FeedLibrary'
import FeedContentRenderer from '../components/FeedContentRenderer'
import FeedCollection from '../components/FeedCollection'
import FeedFolder from '../components/FeedFolder'
import FeedHistory from './FeedHistory'
import { useNorepeatNavigate } from '@/hooks'
import useFeedInstance from '../hooks/useFeedInstance'
import { memo, useRef } from 'react'
import { assignProperties } from '@/utils'
import useFeedCollectionContent from '../hooks/useFeedCollectionContent'
import CommonLayoutWrapper from '../../common/CommonLayoutWrapper'
import FeedHeaderBar from '../components/FeedHeaderBar'
import FeedSidebar from '../components/FeedSidebar'
import EditFeedItem from '../components/EditFeedItem'
import ImportFeedModal from '../components/ImportFeedModal'
import NewsDashboard from '../news/NewsDashboard'
import FeedConsts from '../FeedConsts'
import NewsSearch from '../news/NewsSearch'
import useAssignNews from '../news/useAssignNews'

const FeedViewer = memo(() => {
  const instance = useFeedInstance()
  const location = useLocation()
  const params = useParams()
  const navigate = useNorepeatNavigate()
  useAssignNews()
  const scrollElementRef = useRef<HTMLDivElement>(null)
  assignProperties(instance, {
    getCurrentLocation: () => ({ ...location, params }),
    scrollElementRef,
    feedOps: {
      ...instance.feedOps,
      navigate
    }
  })
  useFeedCollectionContent()
  //   useAssignGoogleNews()
  return (
    <>
      <CommonLayoutWrapper children={<Outlet />} scrollElementRef={scrollElementRef} header={<FeedHeaderBar />} sidebar={<FeedSidebar />} />
      <EditFeedItem />
      <ImportFeedModal />
    </>
  )
})

export default createMemoryRouter(
  [
    {
      element: <FeedViewer />,
      path: '/',
      children: [
        {
          path: '/',
          element: <NewsDashboard />
        },
        {
          path: FeedConsts.Routers.Loading,
          element: <FeedLoadingPage />
        },
        {
          path: FeedConsts.Routers.Library,
          element: <FeedLibrary />
        },
        {
          path: '/feed/:id',
          element: <FeedContentRenderer />
        },
        {
          path: '/feed/collection/:id',
          element: <FeedCollection />
        },
        {
          path: '/feed/folder/:id',
          element: <FeedFolder />
        },
        {
          path: '/feed/collection/:id/:feed',
          element: <FeedCollection />
        },
        {
          path: FeedConsts.Routers.History,
          element: <FeedHistory />
        },
        {
          path: FeedConsts.Routers.Search,
          element: <NewsSearch />
        }
      ]
    }
  ],
  {
    initialEntries: ['/']
  }
)
