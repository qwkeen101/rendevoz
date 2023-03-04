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
import PdfJsUrl from '@/assets/pdf.worker.min.js?url'
import PdfJs from './pdfViewer/core/types/pdfJsApi'
import GlobalObjectPanel from './components/GlobalObjectPanel'
import GlobalCreateObject from './components/GlobalCreateObject'
import '@/components/editor/dock.less'
import SvgMarker from './components/svg/Marker'
import Login from './components/login'
import { useUser } from './services/login.service'
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
  const [user] = useUser()
  return (
    <>
      <Notification />
      {user ? (
        <>
          <Initializer />
          <GlobalGraph />
          <GlobalScreenShot />
          <GlobalObjectPanel />
          <GlobalCreateObject />
          <Router>
            {os !== 'macos' && <TitleBar />}
            <Routes />
          </Router>
          <GlobalDragOverlay />
          <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
            <SvgMarker />
          </svg>
        </>
      ) : (
        <Login />
      )}
    </>
  )
}

export default App
