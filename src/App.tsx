import '@icon-park/react/styles/index.less'
import './styles/common.less'
import Initializer, { initializedAtom } from './Initializer'
import './styles/global.less'
import './styles/font.less'
import { GlobalCreateObject, GlobalDragOverlay, GlobalGraph, GlobalScreenShot, SettingAtom } from '@/core'
import Notification from './components/NotificationCenter'
import '@/styles/dock.less'
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
import 'highlight.js/styles/atom-one-dark.css'
import GlobalTextSearch from './core/global/GlobalTextSearch'
import '@/consts/colors.less'
import { Rendevoz } from './core/rendevoz'
import GlobalImporter from './core/global/GlobalImporter'
import PluginManager from './core/plugin/PluginManager'
import BuiltinEditorPlugin from './core/plugin/builtin/EditorPlugin'
import { KeyToRegisteredGlobalElements } from './core/plugin/RegisterMap'
import GlobalUtils from '@/core/global/GlobalUtils'
import GlobalPdfPrinter from '@/core/global/GlobalPdfPrinter'
import InnerHookz from '@/core/rendevoz/hooks'
import * as InnerComponentz from '@/core/rendevoz/components'
import createCache from '@emotion/cache'
import { BuiltInDraggableElement, BuiltInDropOn, BuiltInMetaObjectTypes, BuiltInObjectTypes, BuiltInTabTypes } from '~/typings'
import { GlobalBaidudisk } from '@/components/fileImporter/baidudisk/BaidudiskDisplayer'
import { useSelectGlobalAtomValue } from '@/hooks'
import registerTabs from '@/api/lifycycle/startup/registerTabs'
import GlobalCollection from '@/core/global/GlobalCollection'
import { GlobalObjectDetails } from '@/core/object/details'
import GlobalPreviewPanel from '@/core/global/GlobalPreviewPanel'
import GlobalObjectCreator from '@/core/global/GlobalObjectCreator'
import GlobalQuickAdd from '@/components/form/quickAdd/GlobalQuickAdd'
import GlobalDownloadIndicator from '@/core/global/DownloadIndicator'
import { useAtomValue } from 'jotai'
import './styles/util.less'
import Loading from '@/components/Loading'
import './styles/loading.less'
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

export const GlobalPluginManager = new PluginManager()
declare module 'rendevoz' {
  export interface CustomTypes {
    MetaObject: BuiltInMetaObjectTypes
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
const cache = createCache({ key: 'external', speedy: false })
const App = () => {
  Rendevoz.InnerHooks = InnerHookz
  Rendevoz.InnerComponents = InnerComponentz
  const PdfJs = window['pdfjs-dist/build/pdf']

  PdfJs.GlobalWorkerOptions.workerSrc = PdfJsUrl
  const lang = useSelectGlobalAtomValue(SettingAtom, s => s.general.language)
  const { i18n } = useTranslation()
  const executed = useRef(false)
  if (!executed.current) {
    registerTabs()
    GlobalPluginManager.registerPlugin(BuiltinEditorPlugin)
    executed.current = true
    // channelScraper()
  }
  const initialized = useAtomValue(initializedAtom)
  useEffect(() => {
    i18n.changeLanguage(lang)
  }, [lang])

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
        <Initializer />
        <ThemeSwitcher />
        <Notification />
        <>
          <GlobalDownloadIndicator />
          <GlobalTextSearch />
          <GlobalGraph />
          <GlobalScreenShot />
          <GlobalPreviewPanel />
          <GlobalQuickAdd />
          <GlobalBaidudisk />
          <GlobalSearchPanel />
          <GlobalCollection />
          <GlobalObjectCreator />
          <GlobalObjectDetails />
          <GlobalCreateObject />
          <GlobalTranslateResult />
          {initialized ? <AuthenticatedLayout /> : <Loading />}
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
