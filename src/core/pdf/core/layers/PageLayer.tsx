import { PageViewport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { FC, forwardRef, memo, MutableRefObject, ReactElement, useRef, useState } from 'react'
import { useIsomorphicLayoutEffect } from 'react-use'
import { Box, PageFunctionRef, RenderPageProps } from '~/typings'
import { getPage } from '../utils/pages'
import CanvasLayer from './CanvasLayer'
import TextLayer from './TextLayer'
import styles from './index.module.less'
import Spinner from '@/components/base/Spinner'
import { useMemoizedFn, useMergedRef, useSelectAtomValue } from '@/hooks'
import AnnotationLayer from './AnnotationLayer'
import { IAnnotation } from '../types/annotation'
import usePdfViewer from '../hooks/useViewer'
import { PAGE_INDEX_TO_PAGE_FUNCTION } from '../weakMaps'
import useCroppingImage from '@/core/pdf/core/hooks/useCroppingImage'

interface PageLayerProps {
  doc: PDFDocumentProxy
  height: number
  scale: number
  width: number
  pageIndex: number
  renderPage?: (props: RenderPageProps) => ReactElement
  renderAnnotation?: (annotation: IAnnotation) => ReactElement
  scrollElement?: MutableRefObject<HTMLDivElement>
  transformScale?: number
}
interface PageDetails {
  page: PDFPageProxy | null
  viewport: PageViewport | null
  realHeight?: number
  realWidth?: number
}
// todo: impl page rotation
const PageLayer: FC<PageLayerProps> = forwardRef(
  ({ doc, height, scale, width, pageIndex, renderPage, renderAnnotation, scrollElement, transformScale }, ref) => {
    const [pageDetails, setPageDetails] = useState<PageDetails>({
      page: null,
      viewport: null
    })

    const [highlightState, setHighlightState] = useState<{
      visible?: boolean
      rect?: Box
    }>()

    const pageRef = useRef<HTMLDivElement>(null)
    const mergedRef = useMergedRef(pageRef, ref)
    const pageFunctionRef = useRef<PageFunctionRef>({})
    const viewer = usePdfViewer()
    const { isCroppingImage, renderSelectBox } = useCroppingImage(pageRef, async box => {
      const path = await viewer.capturePageImage?.(pageIndex, box)
      if (path) {
        pageFunctionRef.current.onImageCropped?.(box, path)
      }
    })

    pageFunctionRef.current.highlightArea = rect => {
      setHighlightState({
        rect,
        visible: true
      })
    }

    const getPageDetails = () => {
      getPage(doc, pageIndex).then(page => {
        const viewport = page.getViewport({ scale })
        setPageDetails({
          page,
          viewport
        })
      })
    }

    const pageRenderer = useMemoizedFn((props: RenderPageProps): ReactElement => {
      if (renderPage) {
        return renderPage(props)
      } else {
        return (
          <>
            {props.canvasLayer}
            {props.textLayer}
            {props.annotationLayer}
          </>
        )
      }
    })
    useIsomorphicLayoutEffect(() => {
      if (viewer) {
        const map = PAGE_INDEX_TO_PAGE_FUNCTION.get(viewer) || new Map()
        map.set(pageIndex, pageFunctionRef)
        PAGE_INDEX_TO_PAGE_FUNCTION.set(viewer, map)
      }
      return () => {
        console.log('unmount page ' + pageIndex)
        if (viewer) {
          const map = PAGE_INDEX_TO_PAGE_FUNCTION.get(viewer) || new Map()
          map.delete(pageIndex)
          PAGE_INDEX_TO_PAGE_FUNCTION.set(viewer, map)
        }
      }
    }, [])

    useIsomorphicLayoutEffect(() => {
      getPageDetails()
    }, [scale.toFixed(2)])

    return (
      <>
        <div
          ref={mergedRef}
          style={{
            height: pageDetails.viewport?.height || height,
            width: pageDetails.viewport?.width || width,
            cursor: isCroppingImage ? 'crosshair' : undefined
          }}
          className={styles.pageLayer}
        >
          {renderSelectBox()}
          {pageDetails.viewport ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                pointerEvents: isCroppingImage ? 'none' : 'auto'
              }}
            >
              {pageRenderer({
                containerRef: pageRef,
                pageElement: pageRef.current,
                canvasLayer: (
                  <CanvasLayer
                    pageIndex={pageIndex}
                    transformScale={transformScale}
                    page={pageDetails.page}
                    scale={scale}
                    width={pageDetails.viewport.width}
                    height={pageDetails.viewport.height}
                    viewport={pageDetails.viewport}
                    pageFunctionRef={pageFunctionRef}
                  />
                ),
                textLayer: (
                  <TextLayer
                    pageIndex={pageIndex}
                    page={pageDetails.page}
                    scale={scale}
                    rotation={0}
                    width={pageDetails.viewport.width}
                    height={pageDetails.viewport.height}
                    viewport={pageDetails.viewport}
                    pageFunctionRef={pageFunctionRef}
                    transformScale={transformScale}
                  />
                ),
                annotationLayer: (
                  <AnnotationLayer
                    page={pageDetails.page}
                    width={pageDetails.viewport.width}
                    height={pageDetails.viewport.height}
                    scale={scale}
                    viewport={pageDetails.viewport}
                    renderAnnotation={renderAnnotation}
                  />
                ),
                pageIndex: pageIndex,
                pageSize: { width: pageDetails.viewport.width, height: pageDetails.viewport.height, scale },
                pageFunctionRef
              })}
            </div>
          ) : (
            <Spinner size={50} />
          )}
        </div>
        {highlightState?.visible && highlightState.rect && (
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0
            }}
            onClick={e => {
              if (e.target === e.currentTarget) {
                setHighlightState(undefined)
              }
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: `${highlightState.rect.top * 100}%`,
                width: `${highlightState.rect.width * 100}%`,
                left: `${highlightState.rect.left * 100}%`,
                height: `${highlightState.rect.height * 100}%`,
                boxShadow: '0 0 0 9999em rgb(0,0,0,0.7)'
              }}
            ></div>
          </div>
        )}
      </>
    )
  }
)

export default memo(PageLayer)
