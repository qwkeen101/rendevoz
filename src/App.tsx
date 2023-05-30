import '@icon-park/react/styles/index.less'
import './common.less'
import TitleBar from './components/titlebar'
import Initializer from './Initializer'
import './global.less'
import { GlobalDragOverlay } from '@/core'
import Notification from './components/NotificationCenter'
import { GlobalObjectPanel, GlobalCreateObject, GlobalScreenShot, GlobalGraph } from '@/core'
import '@/core/editor/dock.less'
import SvgMarker from './components/svg/Marker'
import { useSetting } from './core/setting'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorFallback from './components/base/ErrorFallBack'
import AuthenticatedLayout from './components/base/authenticatedLayout'
// import '@/core/pdf/core/types/pdf.min.js'
import '@/assets/pdf.js'
import PdfJsUrl from '@/assets/pdf.worker.js?url'
import ThemeSwitcher from './ThemeSwitcher'
import GlobalImagePreviewer from './core/global/GlobalImagePreviewer'
import classNames from 'classnames'
import { css } from '@emotion/css'
import GlobalTranslateResult from './core/global/translate/GlobalTranslatePanel'
import GlobalSearchPanel from './core/global/GlobalSearchPanel'
import GlobalWebview from './core/global/GlobalWebview'
import 'highlight.js/styles/atom-one-dark.css'
import GlobalTextSearch from './core/global/GlobalTextSearch'
import '@/consts/colors.less'

export function getOS() {
  const userAgent = window.navigator.userAgent.toLowerCase(),
    macosPlatforms = /(macintosh|macintel|macppc|mac68k|macos)/i,
    windowsPlatforms = /(win32|win64|windows|wince)/i,
    iosPlatforms = /(iphone|ipad|ipod)/i
  let os = null

  if (macosPlatforms.test(userAgent)) {
    os = 'macos'
  } else if (iosPlatforms.test(userAgent)) {
    os = 'ios'
  } else if (windowsPlatforms.test(userAgent)) {
    os = 'windows'
  } else if (/android/.test(userAgent)) {
    os = 'android'
  } else if (!os && /linux/.test(userAgent)) {
    os = 'linux'
  }

  return os
}

const App = () => {
  const PdfJs = window['pdfjs-dist/build/pdf']
  PdfJs.GlobalWorkerOptions.workerSrc = PdfJsUrl

  const os = getOS()

  const [setting] = useSetting()
  const { i18n } = useTranslation()
  useEffect(() => {
    if (setting.general.language) {
      i18n.changeLanguage(setting.general.language)
    }
  }, [setting.general.language])
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {/* for unknown queryselector bug */}
      <div
        className={classNames(
          'excalidraw',
          css({
            '--color-selection': '#6965db'
          })
        )}
        style={{ display: 'none' }}
      ></div>
      <ThemeSwitcher />
      {os !== 'macos' && <TitleBar />}
      <Notification />
      <>
        <Initializer />
        <GlobalTextSearch />
        <GlobalGraph />
        <GlobalScreenShot />
        <GlobalWebview />
        <GlobalObjectPanel />
        <GlobalSearchPanel />
        <GlobalCreateObject />
        <GlobalTranslateResult />
        <AuthenticatedLayout />
        <GlobalDragOverlay />
        <GlobalImagePreviewer />
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <SvgMarker />
        </svg>
      </>
    </ErrorBoundary>
  )
}

export default App
