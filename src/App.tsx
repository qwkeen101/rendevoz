import '@icon-park/react/styles/index.less'
import './common.less'
import TitleBar from './components/titlebar'
import Initializer from './Initializer'
import './global.less'
import { GlobalCreateObject, GlobalDragOverlay, GlobalGraph, GlobalObjectPanel, GlobalScreenShot, ObjectTimeline, useSetting } from '@/core'
import Notification from './components/NotificationCenter'
import '@/core/editor/dock.less'
import SvgMarker from './components/svg/Marker'
import { Fragment, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorFallback from './components/base/ErrorFallBack'
import AuthenticatedLayout from './components/base/authenticatedLayout'
import '@/assets/pdf.js'
import PdfJsUrl from '@/assets/pdf.worker.js?url'
import ThemeSwitcher from './ThemeSwitcher'
import GlobalImagePreviewer from './core/global/GlobalImagePreviewer'
import classNames from 'classnames'
import { css } from '@emotion/css'
import { CacheProvider } from '@emotion/react'
import GlobalTranslateResult from './core/global/translate/GlobalTranslatePanel'
import GlobalSearchPanel from './core/global/GlobalSearchPanel'
import GlobalWebview from './core/global/GlobalWebview'
import 'highlight.js/styles/atom-one-dark.css'
import GlobalTextSearch from './core/global/GlobalTextSearch'
import '@/consts/colors.less'
import EditorPage from './scenes/editor'
import ImagePage from './scenes/ImagePage'
import PdfPage from './scenes/pdf'
import VideoPage from './scenes/VideoPage'
import { Rendevoz } from './core/rendevoz'
import Webpage from './core/webpage/Webpage'
import WhiteboardPage from './scenes/WhiteboardPage'
import { HomePage } from './scenes/HomePage'
import DatabasePage from './scenes/DatabasePage'
import GlobalImporter from './core/global/GlobalImporter'
import PluginManager from './core/plugin/PluginManager'
import BuiltinEditorPlugin from './core/plugin/builtin/EditorPlugin'
import TestPlugin from './TestPlugin'
import { KeyToRegisteredGlobalElements } from './core/plugin/RegisterMap'
import { ILayoutTab, TabData } from 'rendevoz'
import Id from '@/utils/id'
import GlobalUtils from '@/core/global/GlobalUtils'
import GlobalPdfPrinter from '@/core/global/GlobalPdfPrinter'
import GraphPage from '@/scenes/GraphPage'
import InnerHookz from '@/core/rendevoz/hooks'
import * as InnerComponentz from '@/core/rendevoz/components'
import createCache from '@emotion/cache'
import useBetterFilter from '@/core/database/filter/useBetterFilter'
import MetaGroupPage from '@/scenes/MetaGroupPage'
import { BuiltInDraggableElement, BuiltInDropOn, BuiltInMetaObjectTypes, BuiltInObjectTypes, BuiltInTabTypes } from '~/typings'
import { ObjectStore } from '@/stores'
import { GlobalBaidudisk } from '@/components/fileImporter/baidudisk/BaidudiskDisplayer'
// import { startDrive } from '@/driver'
// import ReviewManager from '@/core/review/components/ReviewManager'
// import TimelineManager from '@/core/database/TimelineManager'
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

const RENDEVOZ_DEFAULT_TABS: TabData[ILayoutTab['type']][] = [
  {
    type: 'note',
    content: opts =>
      opts.objectId && (
        <EditorPage type="note" noteId={opts.objectId} id={Id.getStrId()} onInstanceInitialized={opts.onInstanceInitialized} />
      )
  },
  {
    type: 'image',
    content: opts => opts.objectId && <ImagePage imageId={opts.objectId} />
  },
  {
    type: 'pdf',
    content: opts => opts.objectId && <PdfPage pdfId={opts.objectId} onInstanceInitialized={opts.onInstanceInitialized} />
  },
  {
    type: 'video',
    content: opts => opts.objectId && <VideoPage videoId={opts.objectId} onInstanceInitialized={opts.onInstanceInitialized} />
  },
  {
    type: 'webpage',
    content: opts =>
      opts.objectId && (
        <Webpage
          onWebpageChange={newWebpage => {
            opts.tab.objectId = newWebpage.webpageId
            opts.objectId = newWebpage.webpageId
          }}
          initialWebpageId={opts.objectId}
          onInstanceInitialized={opts.onInstanceInitialized}
        />
      )
  },
  {
    type: 'whiteboard',
    content: opts => opts.objectId && <WhiteboardPage whiteboardId={opts.objectId} onInstanceInitialized={opts.onInstanceInitialized} />
  },
  {
    type: 'home',
    content: () => <HomePage />
  },
  {
    type: 'database',
    content: () => <DatabasePage />
  },
  {
    type: 'graph',
    content: () => <GraphPage />
  },
  {
    type: 'review',
    content: () => <ReviewManager />
  },
  {
    type: 'timeline',
    content: () => <ObjectTimeline />
  },
  {
    type: 'group',
    content: opts => <MetaGroupPage groupId={opts.objectId} />
  }
]

export const GlobalPluginManager = new PluginManager()
declare module 'rendevoz' {
  export interface CustomTypes {
    MetaObject: BuiltInMetaObjectTypes | 'customEle' | 'task' | 'collection'
    Object: BuiltInObjectTypes & {
      task: {
        specType: 'task'
      }
    }
    DropOn: BuiltInDropOn
    DraggableElement: BuiltInDraggableElement
    Tab:
      | BuiltInTabTypes
      | {
          type: 'taskManager'
          instance: never
          objectId: never
        }
  }
}
export const cache = createCache({ key: 'external', speedy: false })
const App = () => {
  Rendevoz.InnerHooks = InnerHookz
  Rendevoz.InnerComponents = InnerComponentz
  const PdfJs = window['pdfjs-dist/build/pdf']
  PdfJs.GlobalWorkerOptions.workerSrc = PdfJsUrl

  const os = getOS()
  useBetterFilter()
  const [setting] = useSetting()
  const { i18n } = useTranslation()
  const executed = useRef(false)
  if (!executed.current) {
    RENDEVOZ_DEFAULT_TABS.forEach(i => Rendevoz.Actions.Layout.registerTabData(i))
    GlobalPluginManager.registerPlugin(BuiltinEditorPlugin)
    executed.current = true

    setTimeout(() => {
      // Rendevoz.Actions.Layout.openNewTab({ data: { type: 'group', objectId: 1 } })
      // ObjectStore('group').addOne({ rootFilterGroup: { groupType: 'and', rules: [], filterType: 'group' }, id: 1, childrenMetaIds: [] })
      // startDrive()
      // Rendevoz.Actions.Layout.openNewTab({ data: { type: 'review' } })
    }, 2000)
  }

  useEffect(() => {
    if (setting.general.language) {
      i18n.changeLanguage(setting.general.language)
    }
  }, [setting.general.language])

  const registeredGlobalElements = Array.from(KeyToRegisteredGlobalElements.entries())

  return (
    <CacheProvider value={cache}>
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
          <GlobalBaidudisk />
          <GlobalSearchPanel />
          <GlobalCreateObject />
          <GlobalTranslateResult />
          <AuthenticatedLayout />
          <GlobalDragOverlay />
          <GlobalImagePreviewer />
          <GlobalImporter />
          <GlobalPdfPrinter />
          <GlobalUtils />
          {registeredGlobalElements.map(entry => (
            <Fragment key={entry[0]}>{entry[1]()}</Fragment>
          ))}
          <svg
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              overflow: 'hidden'
            }}
          >
            <SvgMarker />
          </svg>
        </>
      </ErrorBoundary>
    </CacheProvider>
  )
}

export default App
