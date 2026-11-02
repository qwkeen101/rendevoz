import '@icon-park/react/styles/index.less'
import './styles/global.less'
import './styles/styles.less'
import './styles/pro.less'
import './styles/animate.less'
import 'mingcute_icon/font/Mingcute.css'
import { GlobalDragOverlay, GlobalSetting } from '@/core'
import '@/styles/dock.less'
import SvgMarker from './components/svg/Marker'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorFallback from './components/base/ErrorFallBack'
import * as pdfjsLib from 'pdfjs-dist'
import PdfJsUrl from '@/assets/pdf.worker.mjs?url'
import ImagePreviewer from './core/global/components/ImagePreviewer'
import TextSearch from './core/global/components/TextSearch'
import '@/consts/colors.less'
import FileImporter from './core/global/components/FileImportProcessor'
import GlobalUtils from '@/core/global/GlobalUtils'
import { BuiltInDraggableElement, BuiltInDropOn, BuiltInMetaObjectTypes, BuiltInObjectTypes, BuiltInTabTypes } from '~/typings'
import GlobalCollection from '@/core/global/components/CollectionSelector'
import { GlobalObjectDetails } from '@/core/object/details'
import GlobalObjectCreator from '@/core/global/components/ObjectCreator'
import GlobalQuickAdd from '@/components/form/quickAdd/GlobalQuickAdd'
import GlobalDownloadIndicator from '@/core/global/DownloadIndicator'
import './styles/util.less'
import GlobalDialog from '@/core/global/GlobalDialog'
import { ChineseFormats, DateFormat, EnglishFormats } from '@/utils'
import useGlobalShortcutHandler from '@/core/global/ShortcutHandler'
import ObjectEditForm from '@/core/global/components/ObjectEditForm'
import APIComponents from '@/api/components/APIComponents'
import ExplainPanel from '@/core/global/generalAIHelpers/ExplainPanel'
import TranslatePanel from '@/core/global/generalAIHelpers/TranslatePanel'
import LibraryFileImporter from '@/core/global/components/LibraryFileImporter'
import GlobalExtraPage from '@/core/global/GlobalExtraPage'
import Layout from '@/components/layout'

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

declare module 'rendevoz' {
  export interface CustomTypes {
    MetaObject: BuiltInMetaObjectTypes
    Object: BuiltInObjectTypes
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
const App = () => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PdfJsUrl
  useGlobalShortcutHandler()
  const lang = GlobalSetting.useSelectSettingAtom('language')
  const { i18n } = useTranslation()
  useEffect(() => {
    i18n.changeLanguage(lang)
    const currentLang = i18n.language
    if (currentLang === 'zh-CN') {
      DateFormat.Formats = {
        ...DateFormat.Formats,
        ...ChineseFormats
      }
    } else {
      DateFormat.Formats = {
        ...DateFormat.Formats,
        ...EnglishFormats
      }
    }
  }, [lang])
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <GlobalExtraPage />
      <APIComponents />
      <GlobalDownloadIndicator />
      <LibraryFileImporter />
      <TextSearch />
      <GlobalSetting.SettingDialog />
      <GlobalQuickAdd />
      <ExplainPanel />
      <TranslatePanel />
      <GlobalDialog />
      <ObjectEditForm />
      <GlobalCollection />
      <GlobalObjectCreator />
      <GlobalObjectDetails />
      <Layout />
      <GlobalDragOverlay />
      <ImagePreviewer />
      <FileImporter />
      <GlobalUtils />
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
    </ErrorBoundary>
  )
}

export default App
