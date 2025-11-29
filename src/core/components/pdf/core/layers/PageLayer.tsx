import { PageViewport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import React, { FC, forwardRef, Fragment, memo, useEffect, useRef, useState } from 'react'
import { useIsomorphicLayoutEffect, useUnmount } from 'react-use'
import { Box, IPDFLabel, SelectedTextEvent } from '~/typings'
import { getPage } from '../utils/pages'
import CanvasLayer from './CanvasLayer'
import TextLayer from './TextLayer'
import Spinner from '@/components/base/Spinner'
import { useMergedRef, useSelectAtomValue } from '@/hooks'
import AnnotationLayer from './AnnotationLayer'
import useCroppingImage from '@/core/components/pdf/core/hooks/useCroppingImage'
import { atom } from 'jotai/index'
import { useAtom, useSetAtom } from 'jotai'
import { Colors } from '@/consts'
import classnames from 'classnames'
import ContextMenu from '@/components/contextMenu'
import PageContextMenu from './PageContextMenu'
import { PDFStateAtom } from '@/core/components/pdf/hooks/usePDFState'
import HighlightLabel from '@/core/components/pdf/components/label/HighlightLabel'
import CropLabel from '@/core/components/pdf/components/label/CropLabel'
import { AnimatePopover, WithBorder } from '@/components'
import TextSelectionToolbar from '@/core/components/pdf/components/toolbar/TextSelectionToolbar'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import FileSystem from '@/api/fileSystem'
import ImageCropToolbar from '@/core/components/pdf/components/toolbar/ImageCropToolbar'

interface PageLayerProps {
  doc: PDFDocumentProxy
  height: number
  scale: number
  width: number
  pageIndex: number
  transformScale?: number
  boxShadowName?: string
  scaleChanged?: boolean
}
interface PageDetails {
  page: PDFPageProxy | null
  viewport: PageViewport | null
  realHeight: number
  realWidth: number
}

const highlightStateAtom = atom<{
  visible?: boolean
  rect?: Box
  page?: number
}>({})
const PageLayer: FC<PageLayerProps> = forwardRef(({ doc, height, scale, width, pageIndex, transformScale, scaleChanged }, ref) => {
  const [pageDetails, setPageDetails] = useState<PageDetails>({
    page: null,
    viewport: null,
    realHeight: 0,
    realWidth: 0
  })

  const [highlightState, setHighlightState] = useAtom(highlightStateAtom)
  const { isCropping, labels } = useSelectAtomValue(PDFStateAtom, s => ({
    isCropping: s.croppingImage,
    labels: s.pageToLabels[pageIndex]
  }))
  const pageRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMergedRef(pageRef, ref)
  const instance = usePDFInstance()
  const setState = useSetAtom(PDFStateAtom)
  const { isCroppingImage, renderSelectBox, clearSelectBox } = useCroppingImage(pageRef, async box => {
    setState(s => ({ ...s, croppingImage: false }))
    const path = await instance.capturePageImage?.(pageIndex, box)
    if (path) {
      const bounding = pageRef.current?.getBoundingClientRect()
      if (!bounding) return
      setImageCrop({
        label: {
          type: 'crop',
          rect: box,
          imageUrl: path,
          page: pageIndex,
          color: 'rgba(39, 158, 255)'
        },
        box: {
          width: box.width * bounding.width,
          height: box.height * bounding.height,
          left: bounding.left + bounding.width * box.left,
          top: bounding.top + bounding.height * box.top
        }
      })
    }
  })
  instance.values.INDEX_TO_PAGE_LAYER[pageIndex] = {
    ...instance.values.INDEX_TO_PAGE_LAYER[pageIndex],
    clearCrop: clearSelectBox,
    highlightArea: rect => {
      setHighlightState({
        rect,
        visible: true,
        page: pageIndex
      })
    }
  }

  useUnmount(() => {
    delete instance.values.INDEX_TO_PAGE_LAYER[pageIndex]
  })
  const getPageDetails = () => {
    getPage(doc, pageIndex).then(page => {
      const viewport = page.getViewport({ scale })
      let vw = viewport.width
      let vh = viewport.height
      if (!scaleChanged && vw >= width) {
        const ratio = width / vw
        vh = ratio * vh
        vw = ratio * vw
      }
      setPageDetails({
        page,
        viewport,
        realWidth: vw,
        realHeight: vh
      })
    })
  }

  useIsomorphicLayoutEffect(() => {
    getPageDetails()
  }, [scale.toFixed(2)])
  const [textSelect, setTextSelect] = useState<SelectedTextEvent>()
  const [imageCrop, setImageCrop] = useState<{
    label: Partial<IPDFLabel & { type: 'crop' }>
    box: Box
  }>()

  const { realHeight, realWidth, viewport, page } = pageDetails
  return (
    <ContextMenu ref={mergedRef} content={setV => <PageContextMenu onClose={() => setV(false)} pageIndex={pageIndex} />}>
      <div
        style={{
          height: realHeight || height,
          width: realWidth || width
        }}
        className={classnames('mx-auto bg-global relative', isCroppingImage && '*:!cursor-crosshair')}
      >
        {highlightState?.visible && highlightState.rect && (
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
              overflow: 'hidden',
              zIndex: 9999,
              background: highlightState.page === pageIndex ? undefined : 'rgb(0,0,0,0.7)'
            }}
            onClick={e => {
              if (e.target === e.currentTarget) {
                setHighlightState({})
              }
            }}
          >
            {highlightState.page === pageIndex && (
              <div
                style={{
                  borderRadius: 4,
                  outline: `3px solid ${Colors.Common.SelectColor}`,
                  position: 'absolute',
                  top: `${highlightState.rect.top * 100}%`,
                  width: `${highlightState.rect.width * 100}%`,
                  left: `${highlightState.rect.left * 100}%`,
                  height: `${highlightState.rect.height * 100}%`,
                  boxShadow: '0 0 0 9999em rgb(0,0,0,0.7)'
                }}
              ></div>
            )}
          </div>
        )}
        {renderSelectBox()}
        {viewport && page ? (
          <>
            <AnimatePopover
              padding={10}
              onClickOutside={() => {
                setTextSelect(undefined)
              }}
              visible={textSelect !== undefined}
              position={{
                left: textSelect?.e.clientX || 0,
                top: textSelect?.e.clientY || 0
              }}
              content={
                <WithBorder className={'!rounded-lg'}>
                  <TextSelectionToolbar pageIndex={pageIndex} onClose={() => setTextSelect(undefined)} textSelect={textSelect} />
                </WithBorder>
              }
            ></AnimatePopover>
            <AnimatePopover
              padding={10}
              onClickOutside={() => {
                setImageCrop(undefined)
                if (imageCrop?.label.imageUrl) {
                  FileSystem.fs.deleteFile(imageCrop.label.imageUrl)
                }
                if (imageCrop) {
                  clearSelectBox()
                }
              }}
              visible={imageCrop !== undefined}
              positions={['bottom', 'top']}
              position={{
                left: imageCrop?.box ? imageCrop?.box.width / 2 + imageCrop?.box.left : 0,
                top: imageCrop?.box ? imageCrop?.box.height + imageCrop?.box.top : 0
              }}
              content={
                <WithBorder className={'!rounded-lg'}>
                  <ImageCropToolbar pageIndex={pageIndex} onClose={() => setImageCrop(undefined)} imageCrop={imageCrop} />
                </WithBorder>
              }
            ></AnimatePopover>
            {isCropping && (
              // crop cover
              <div
                className={'w-full h-full absolute inset-0'}
                style={{
                  zIndex: 1000
                }}
              ></div>
            )}
            {labels?.length ? (
              <div
                style={{
                  zIndex: 999
                }}
                className={'w-full h-full absolute inset-0 pointer-events-none'}
                role="custom-element-layer"
              >
                {labels?.map(i => (
                  <Fragment key={i.id}>
                    {i.type === 'highlight' && <HighlightLabel labelId={i.id} key={i.id} width={realWidth} height={realHeight} />}
                    {i.type === 'crop' && (
                      <CropLabel labelId={i.id} width={realWidth} height={realHeight} transformScale={transformScale} />
                    )}
                  </Fragment>
                ))}
              </div>
            ) : null}
            <CanvasLayer page={page} width={realWidth} height={realHeight} viewport={viewport} />
            <TextLayer
              pageIndex={pageIndex}
              scale={scale}
              rotation={0}
              width={realWidth}
              onTextSelected={e => {
                setTextSelect(e)
              }}
              page={page}
              onClearTextSelect={() => setTextSelect(undefined)}
              height={realHeight}
              viewport={viewport}
              transformScale={transformScale}
            />
            <AnnotationLayer page={page} width={realWidth} height={realHeight} scale={scale} viewport={viewport} />
          </>
        ) : (
          <Spinner size={50} />
        )}
      </div>
    </ContextMenu>
  )
})

export default memo(PageLayer)
