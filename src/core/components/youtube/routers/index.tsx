import { createMemoryRouter, Outlet, useLocation, useNavigationType, useParams } from 'react-router-dom'
import YoutubeConsts from '@/core/components/youtube/YoutubeConsts'
import YoutubeDashboard from '@/core/components/youtube/dashboard/YoutubeDashboard'
import YoutubeChannel from '@/core/components/youtube/channel/YoutubeChannel'
import YoutubeVideo from '@/core/components/youtube/YoutubeVideo'
import YoutubeFolder from '@/core/components/youtube/routers/YoutubeFolder'
import YoutubeLibrary from '@/core/components/youtube/routers/YoutubeLibrary'
import YoutubeSearch from '@/core/components/youtube/routers/YoutubeSearch'
import YoutubePlaylist from '@/core/components/youtube/routers/YoutubePlaylist'
import YoutubeHistory from '@/core/components/youtube/routers/YoutubeHistory'
import YoutubeLoadingPage from '@/core/components/youtube/routers/YoutubeLoadingPage'
import { useNorepeatNavigate, useSelectAtomValue } from '@/hooks'
import { GlobalSetting } from '@/core'
import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import useElementScrollRestore from '@/components/base/useElementScrollRestore'
import useYoutubeData from '@/core/components/youtube/hooks/useYoutubeData'
import TabTitle from '../../../../components/layout/TabTitle'
import yt from '@/assets/images/youtube.png'
import { Icon, Modal } from '@/components'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import trans from '@/consts/trans'
import CommonLayoutWrapper from '@/core/components/common/CommonLayoutWrapper'
import YoutubeSidebar from '@/core/components/youtube/components/YoutubeSidebar'
import YoutubeHeaderBar from '@/core/components/youtube/YoutubeHeaderBar'
import GlobalYoutubeViewer from '@/core/components/youtube/GlobalYoutubeViewer'

const Container = () => {
  const location = useLocation()
  const params = useParams()
  const navigate = useNorepeatNavigate()
  const key = useSelectAtomValue(GlobalSetting.settingAtom, s => s.general.youtubeApiKey)
  const [tipsVisible, setTipsVisible] = useState(false)
  const [v, setV] = useState('')
  const { t } = useTranslation()
  const instance = useYoutubeInstance()
  const scrollElementRef = useRef<HTMLDivElement>(null)
  instance.scrollElementRef = scrollElementRef

  useElementScrollRestore({
    elementRef: scrollElementRef,
    elementKey: location.key
  })

  const navigationType = useNavigationType()
  instance.getCurrentLocation = () => {
    return { ...location, params }
  }
  instance.navigate = navigate
  useLayoutEffect(() => {
    return () => {
      useYoutubeData.updateData(c => ({ ...c, dashboard: { ...c.dashboard, topicToVideos: {} } }))
    }
  }, [])
  useLayoutEffect(() => {
    if (navigationType === 'PUSH') {
      scrollElementRef.current?.scrollTo(0, 0)
    }
  }, [location.key])
  if (!key) {
    return (
      <div className={'w-[600px] max-w-[90vw] mx-auto h-full flex flex-col items-center justify-center'}>
        <TabTitle title={'Youtube'} icon={<img src={yt} className={'w-5 h-5 rounded'} />} />
        <Modal visible={tipsVisible} onClose={() => setTipsVisible(false)}>
          <div className={'w-[90vw] max-w-2xl p-6'}>
            <div className={'text-2xl font-bold mb-4'}>{t('feed.API key introduction details title')}</div>
            <ol dangerouslySetInnerHTML={{ __html: t('feed.API key introduction details') }} className={'text-lg flex flex-col gap-1'}></ol>
          </div>
        </Modal>
        <div className={'w-full -mt-6'}>
          <img src={yt} className={'w-20 h-20 mb-3 ml-2'} />
          <div className={'font-bold text-3xl mb-2 pl-2'}>{t('feed.Set up API key')}</div>
          <div className={'pl-2 text-lg'}>
            {t('feed.API key usage')}{' '}
            <span className={'font-bold cursor-pointer hover:underline select-color-font'} onClick={() => setTipsVisible(true)}>
              {t('feed.API key introduction')}
            </span>
          </div>
          <input
            autoFocus
            type={'password'}
            onChange={s => setV(s.target.value)}
            placeholder={t('feed.API key')}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                GlobalSetting.setSetting(curr => ({ ...curr, general: { ...curr.general, youtubeApiKey: v } }))
              }
            }}
            className={'rounded bg-input px-3 py-2 border-box-shadow focus-input ml-2 mt-6 w-full'}
          />
          <div
            onClick={() => {
              if (v) {
                GlobalSetting.setSetting(curr => ({ ...curr, general: { ...curr.general, youtubeApiKey: v } }))
              }
            }}
            className={'flex gap-2 mt-8 w-fit ml-auto pl-4 pr-3 py-1.5 items-center !rounded-full reverse-theme-button'}
          >
            <div>{t(trans.Continue)}</div>
            <Icon strokeWidth={5} size={16} name={'park-right'} />
          </div>
        </div>
      </div>
    )
  }
  return (
    <>
      <CommonLayoutWrapper
        children={<Outlet />}
        scrollElementRef={scrollElementRef}
        sidebar={<YoutubeSidebar />}
        header={<YoutubeHeaderBar />}
      />
      <GlobalYoutubeViewer />
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
          path: YoutubeConsts.Routers.Dashboard,
          element: <YoutubeDashboard />
        },
        {
          path: '/youtube/channel/:id',
          element: <YoutubeChannel />
        },
        {
          path: '/youtube/channel/:id/:tab',
          element: <YoutubeChannel />
        },
        {
          path: '/youtube/video/:id',
          element: <YoutubeVideo />
        },
        {
          path: '/youtube/folder/:id',
          element: <YoutubeFolder />
        },
        {
          path: YoutubeConsts.Routers.Library,
          element: <YoutubeLibrary />
        },
        {
          path: YoutubeConsts.Routers.Search,
          element: <YoutubeSearch />
        },
        {
          path: '/youtube/playlist/:id',
          element: <YoutubePlaylist />
        },
        {
          path: YoutubeConsts.Routers.History,
          element: <YoutubeHistory />
        },
        {
          path: YoutubeConsts.Routers.Loading,
          element: <YoutubeLoadingPage />
        }
      ]
    }
  ],
  {
    initialEntries: ['/dashboard']
  }
)
