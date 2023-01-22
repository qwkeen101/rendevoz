/*
 Copyright (C) 2022 RealRong 2001

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Provider as JotaiProvider } from 'jotai'
import { BrowserRouter as Router } from 'react-router-dom'
import Routes from './routes'
import { GlobalScope } from './jotai/jotaiScope'
import '@icon-park/react/styles/index.less'
import './common.less'
import { Toaster } from 'react-hot-toast'
import TitleBar from './components/titlebar'
import Initializer from './Initializer'
import './global.less'
import GlobalGraph from './components/graph/GlobalGraph'
import GlobalDragOverlay from './components/GlobalDragOverlay'
import GlobalScreenShot from './components/globalScreenShot'
import Zindexes from './consts/zindex'

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
    <JotaiProvider scope={GlobalScope}>
      <Toaster containerStyle={{ zIndex: Zindexes.Tooltip }} />
      <Initializer />
      <GlobalGraph />
      <GlobalScreenShot />
      <Router>
        {os !== 'macos' && <TitleBar />}
        <Routes />
      </Router>
      <GlobalDragOverlay />
    </JotaiProvider>
  )
}

export default App
