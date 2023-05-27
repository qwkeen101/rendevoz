import { Button, Content } from '@/components'
import { ObjectStore } from '@/stores'
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Provider, atom } from 'jotai'
import CanvasManager from '@/components/base/canvas/CanvasManager'
import Colors from '@/consts/colors'
// import { Excalidraw, exportToBlob } from '../excalidraw/src/index'
import { css } from '@emotion/css'
import { useSetting } from '../setting'
import classNames from 'classnames'
import { ExcalidrawImperativeAPI } from '../excalidraw/src/types'
import Id from '@/utils/id'
import { exportToBlob } from '../excalidraw/src/packages/utils'
import { Excalidraw, loadFromBlob } from '@excalidraw/excalidraw'
import { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types/types'
import { renderPageInNormalMode } from '../pdf/core/utils/renderer'
import { imageToDataUrl } from '@/utils/img'
import transformUrlToData from './transformUrlToData'
import saveExcalidraw from './saveExcalidraw'
import { t } from 'i18next'

const defaultData = {
  appState: {
    showWelcomeScreen: false,
    openSidebar: null,
    showStats: false,
    viewBackgroundColor: 'transparent'
  }
}
export const CanvasManagerAtom = atom<CanvasManager | undefined>(undefined)
const ImageDisplayer = forwardRef<
  ExcalidrawImperativeAPI,
  { imageId?: number; imageUrl?: string; initialData?: ExcalidrawInitialDataState }
>(({ imageId, imageUrl: outerImageUrl, initialData }, ref) => {
  const image = ObjectStore('image').useValue(imageId)
  const [excalidrawInitialData, setInitialData] = useState<ExcalidrawInitialDataState>()
  const [setting] = useSetting()
  const containerRef = useRef<HTMLDivElement>(null)
  const getSizeOfImage = (image: HTMLImageElement) => {
    const container = containerRef.current!
    const containerBounding = container?.getBoundingClientRect()
    const { width, height } = image
    const { width: containerWidth, height: containerHeight } = containerBounding
    const maxImageWidth = Math.min(containerWidth * 0.8, width)
    const imageWidthRatio = maxImageWidth / width
    const realHeight = height * imageWidthRatio
    const x = containerWidth / 2 - maxImageWidth / 2
    const y = containerHeight / 2 - realHeight / 2
    return {
      width: maxImageWidth,
      height: realHeight,
      x,
      y
    }
  }
  const excalidrawRef = useRef<ExcalidrawImperativeAPI>()
  useLayoutEffect(() => {
    if (image) {
      const action = async () => {
        const imageUrl = image.imageUrl
        const img = new Image()
        const excalidrawData = image.excalidrawUrl && (await transformUrlToData(image.excalidrawUrl))
        img.src = imageUrl

        img.onload = () => {
          const result = imageToDataUrl(img)
          const imageSize = getSizeOfImage(img)
          const files = excalidrawData
            ? {
                ...excalidrawData.files,
                initial_image: {
                  mimeType: 'image/png',
                  dataURL: result,
                  id: 'initial_image'
                }
              }
            : {
                initial_image: {
                  mimeType: 'image/png',
                  dataURL: result,
                  id: 'initial_image'
                }
              }
          const imageEle = {
            type: 'image',
            fileId: 'initial_image',
            x: imageSize.x,
            y: imageSize.y,
            width: imageSize.width,
            height: imageSize.height,
            locked: true,
            id: 'initial_image'
          }
          if (excalidrawData) {
            excalidrawData.appState
          }
          const elements = excalidrawData ? [...excalidrawData.elements] : [imageEle]
          setInitialData({
            appState: excalidrawData ? excalidrawData.appState : defaultData.appState,
            files,
            elements
          })
        }
      }
      action()
      return () => {
        const api = excalidrawRef.current
        if (api) {
          saveExcalidraw(api, image.excalidrawUrl).then(path => {
            console.log(path)
            ObjectStore('image').updateOne({ id: image.id, excalidrawUrl: path })
          })
        }
      }
    }
    if (outerImageUrl) {
      const img = new Image()
      img.src = outerImageUrl
      img.onload = () => {
        const size = getSizeOfImage(img)
        setInitialData({
          ...defaultData,
          files: {
            initial_image: {
              mimeType: 'image/png',
              dataURL: outerImageUrl,
              id: 'initial_image'
            }
          },
          elements: [
            {
              type: 'image',
              fileId: 'initial_image',
              x: size.x,
              y: size.y,
              width: size.width,
              height: size.height,
              locked: true,
              id: 'initial_image'
            }
          ]
        })
      }
    }
    if (initialData) {
      setInitialData({
        appState: { ...initialData.appState, ...defaultData.appState },
        elements: initialData.elements,
        files: initialData.files
      })
    }
    renderPageInNormalMode()
  }, [image, outerImageUrl, initialData])

  const langToLangCode = () => {
    const lang = setting.general.language
    switch (lang) {
      case 'en-US':
        return 'en'
      case 'zh-CN':
        return 'zh-CN'
    }
  }

  return (
    <Content
      ref={containerRef}
      fullWidth
      fullHeight
      className={classNames(
        css({
          '.excalidraw .layer-ui__wrapper__top-right': {
            display: 'none'
          },
          '.excalidraw button.help-icon': {
            display: 'none'
          },
          '.excalidraw .HintViewer': {
            display: 'none'
          },
          '.excalidraw .dropdown-menu-button': {
            display: 'none'
          },
          '.excalidraw .ToolIcon__icon': {
            color: `${Colors.Font.Primary}`
          },
          '.excalidraw .ToolIcon__icon svg': {
            color: `${Colors.Font.Primary}`
          },
          '.excalidraw .Island': {
            backgroundColor: Colors.Background.Global,
            border: '1px solid var(--border-background)',
            boxShadow: 'none !important'
          },

          '.excalidraw': {
            '--text-primary-color': Colors.Font.Primary,
            '--input-label-color': Colors.Font.Primary,
            '--button-hover-bg': Colors.Background.ButtonHover,
            '--island-bg-color': Colors.Background.Global,
            '--editor-container-padding': '28px',
            '--shadow-island':
              '0px 2px 12px var(--high-contrast-background), 0px 0px 3.12708px var(--high-contrast-background),0px 0px 0.931014px var(--high-contrast-background)'
          },
          '.excalidraw label, h3, legend': {
            fontSize: '0.9rem !important'
          }
        })
      )}
    >
      <Provider>
        {excalidrawInitialData && (
          <>
            <Button.IconButton
              text={t('general.save locally')}
              style={{ position: 'absolute', top: 30, right: 30, zIndex: 20 }}
              icon="park-download"
              onClick={async () => {
                const api = excalidrawRef.current
                if (api) {
                  const blob = await exportToBlob({
                    quality: 1,
                    appState: api.getAppState(),
                    elements: api.getSceneElements(),
                    files: api.getFiles()
                  })
                  const dataUrl = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = dataUrl
                  a.download = `Rendevoz_image_${Id.getId()}`
                  a.click()
                }
              }}
            ></Button.IconButton>
            <Excalidraw
              onPointerDown={(a, s) => {
                console.log(a, s)
                console.log(excalidrawRef.current?.getFiles())
              }}
              ref={r =>
                r?.readyPromise?.then(v => {
                  excalidrawRef.current = v
                  if (ref) {
                    typeof ref === 'function' ? ref(v) : (ref.current = v)
                  }
                })
              }
              langCode={langToLangCode()}
              initialData={excalidrawInitialData}
            />
          </>
        )}
        {/* {image?.imageUrl && <ImageCanvas imageUrl={image.imageUrl} />} */}
      </Provider>
    </Content>
  )
})

export default ImageDisplayer
