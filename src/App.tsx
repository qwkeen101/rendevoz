import { Provider as JotaiProvider } from 'jotai/react'
import { BrowserRouter as Router } from 'react-router-dom'
import Routes from './routes'
import '@icon-park/react/styles/index.less'
import './common.less'
import TitleBar from './components/titlebar'
import Initializer from './Initializer'
import './global.less'
import GlobalGraph from './components/graph/GlobalGraph'
import GlobalDragOverlay from './components/globalDragOverlay/GlobalDragOverlay'
import GlobalScreenShot from './components/globalScreenShot'
import Notification from './components/NotificationCenter'
import { globalStore } from './stores/stores'
import PdfJsUrl from '@/assets/pdf.worker.min.js?url'
import PdfJs from './pdfViewer/core/types/pdfJsApi'
import GlobalObjectPanel from './components/GlobalObjectPanel'
import GlobalBidirectionTree from './components/bidirectionTree/GlobalBidirectionTree'
import GlobalCreateObject from './components/GlobalCreateObject'
PdfJs.GlobalWorkerOptions.workerSrc = PdfJsUrl
const App = () => {
  function getOS() {
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
  const os = getOS()

  return (
    <JotaiProvider store={globalStore}>
      <Notification />
      {/* <Toaster containerStyle={{ zIndex: Zindexes.Tooltip }} /> */}
      <Initializer />
      <GlobalGraph />
      <GlobalScreenShot />
      <GlobalObjectPanel />
      <GlobalCreateObject />
      <Router>
        <GlobalBidirectionTree />
        {os !== 'macos' && <TitleBar />}
        <Routes />
      </Router>
      <GlobalDragOverlay />
    </JotaiProvider>
  )
}

export default App
