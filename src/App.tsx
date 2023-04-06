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
import Login from './components/Login'
import { useUser } from './services/login.service'
import { useSetting } from './core/setting'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorFallback from './components/base/ErrorFallBack'
import AuthenticatedLayout from './components/base/authenticatedLayout'
import '@/core/pdf/core/types/pdf.min.js'
import PdfJsUrl from '@/assets/pdf.worker.min.js?url'
import ThemeSwitcher from './ThemeSwitcher'

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
  const [user] = useUser()
  const [setting] = useSetting()
  const { i18n } = useTranslation()
  useEffect(() => {
    if (setting.general.language) {
      i18n.changeLanguage(setting.general.language)
    }
  }, [setting.general.language])
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeSwitcher />
      {os !== 'macos' && <TitleBar />}
      <Notification />
      {user ? (
        <>
          <Initializer />
          <GlobalGraph />
          <GlobalScreenShot />
          <GlobalObjectPanel />
          <GlobalCreateObject />
          <AuthenticatedLayout />
          <GlobalDragOverlay />
          <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
            <SvgMarker />
          </svg>
        </>
      ) : (
        <Login />
      )}
    </ErrorBoundary>
  )
}

export default App
