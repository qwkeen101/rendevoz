import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import ThoughtLabel from '../label/Label'
import { WithBorder } from '@/components'
import { RenderPageProps, TextSelectEvent } from '~/typings'
import { AnimatePopover } from '@/components'
import TextSelectionToolbar from '../toolbar/TextSelectionToolbar'
import HighlightLabel from '../label/HighlightLabel'
import useCleanMode from '../../hooks/useCleanMode'
import { useAtomValue } from 'jotai/react'
import { ObjectStore, globalStore } from '@/stores'
import { IHighlightLabel } from '~/typings/data'
import ObjectLabel from '../label/ObjectLabel'
import usePdfDraw from '../../hooks/usePdfDraw'
import produce from 'immer'
import { loadFromBlob } from '@excalidraw/excalidraw'
import usePdfViewer from '../../core/hooks/useViewer'
import { PAGE_INDEX_TO_CANVAS_LAYER } from '../../core/weakMaps'
import { GlobalTranslateInstance } from '@/core/global/GlobalTranslatePanel'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'

interface PdfPageProps extends RenderPageProps {
  pdfId: number
  transformScale?: number
}

const PdfPage: React.FC<PdfPageProps> = ({ pageIndex, textLayer, canvasLayer, annotationLayer, pageFunctionRef, pageSize, pdfId }) => {
  const labelContainerRef = useRef<HTMLDivElement>(null)
  const [cleanMode] = useCleanMode()

  const allLabels = useAtomValue(ObjectStore('pdfLabel').objectMapAtom, { store: globalStore })
  const labels = useMemo(() => {
    return Array.from(allLabels.values()).filter(i => i.page === pageIndex && i.documentId === pdfId)
  }, [allLabels.size])

  const [textSelectionToolbarVisible, setTextSelectionToolbarVisible] = useState(false)
  const [textSelect, setTextSelect] = useState<TextSelectEvent>()

  const viewer = usePdfViewer()
  const { renderModal, open, save, drawOnPdf } = usePdfDraw({
    onClose: async () => {
      const pdf = await ObjectStore('pdf').getOneById(pdfId)
      save()
        .then(res => {
          const savedBlobUrl = res?.data
          if (savedBlobUrl && pdf) {
            const newPageAnnotations = produce(pdf.pageAnnotations || {}, draft => {
              draft[pageIndex] = {
                dataUrl: savedBlobUrl
              }
            })
            ObjectStore('pdf').updateOne({
              id: pdfId,
              pageAnnotations: newPageAnnotations
            })
          }
        })
        .finally(async () => {
          const pdf = await ObjectStore('pdf').getOneById(pdfId)
          const annotation = pdf?.pageAnnotations?.[pageIndex]
          if (annotation && viewer) {
            const canvas = PAGE_INDEX_TO_CANVAS_LAYER.get(viewer)?.get(pageIndex)
            if (annotation.dataUrl && canvas && canvas.getCanvasEle()) {
              const data = await fetch(annotation.dataUrl.replace('rendefile', 'file'))
              const blob = await data.blob()
              const state = await loadFromBlob(blob, null, null)
              drawOnPdf(state.elements, state.appState, state.files, canvas, true)
            }
          }
        })
    }
  })

  if (pageFunctionRef.current) {
    pageFunctionRef.current.onTextSelected = e => {
      setTextSelect(e)
      setTextSelectionToolbarVisible(true)
    }
    pageFunctionRef.current.onTextSelectEnd = () => {
      setTextSelectionToolbarVisible(false)
    }
    pageFunctionRef.current.onCanvasRendered = async () => {
      const pdf = await ObjectStore('pdf').getOneById(pdfId)
      const annotation = pdf?.pageAnnotations?.[pageIndex]
      if (annotation && viewer) {
        const canvas = PAGE_INDEX_TO_CANVAS_LAYER.get(viewer)?.get(pageIndex)
        if (annotation.dataUrl && canvas && canvas.getCanvasEle()) {
          const data = await fetch(annotation.dataUrl.replace('rendefile', 'file'))
          const blob = await data.blob()
          const state = await loadFromBlob(blob, null, null)
          drawOnPdf(state.elements, state.appState, state.files, canvas, false)
        }
      }
    }
  }
  return (
    <>
      {renderModal()}
      {canvasLayer}
      {textLayer}
      {annotationLayer}
      <div
        style={{
          width: '100%',
          height: '100%',
          left: 0,
          position: 'absolute',
          top: 0,
          zIndex: 999,
          pointerEvents: 'none'
        }}
        onClick={async () => {
          // const pdf = await ObjectStore('pdf').getOneById(pdfId)
          // if (pdf?.pageAnnotations?.[pageIndex]) {
          //   const annotation = pdf.pageAnnotations[pageIndex]
          //   if (annotation.dataUrl) {
          //     const data = await fetch(annotation.dataUrl.replace('rendefile', 'file'))
          //     const blob = await data.blob()
          //     open(pageIndex, blob)
          //     return
          //   }
          // }
          // open(pageIndex)
        }}
        ref={labelContainerRef}
        role="custom-element-layer"
      >
        {!cleanMode &&
          labels?.map(
            i =>
              i.id && (
                <Fragment key={i.id}>
                  {i.type === 'highlight' && <HighlightLabel documentId={pdfId} labelId={i.id} key={i.id} pageSize={pageSize} />}
                  {i.type === 'thought' && <ThoughtLabel dragBoundRef={labelContainerRef} labelId={i.id} key={i.id} />}
                  {i.type === 'object' && <ObjectLabel labelId={i.id} key={i.id} pageSize={pageSize} />}
                </Fragment>
              )
          )}
      </div>
      <AnimatePopover
        padding={10}
        visible={textSelectionToolbarVisible}
        containerStyle={{ zIndex: '9999', borderRadius: '999px' }}
        content={
          <WithBorder borderRadius={999} padding="0px 12px">
            <TextSelectionToolbar
              onSearch={e => {
                const pdfMetaId = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(pdfId)
                if (pdfMetaId) {
                  GlobalSearchInstance.open?.({
                    e,
                    query: textSelect?.selectedText,
                    from: {
                      pages: [pageIndex],
                      type: 'pdf',
                      metaId: pdfMetaId,
                      selectedText: textSelect?.selectedText
                    }
                  })
                }
              }}
              onTranslate={e => {
                textSelect?.selectedText &&
                  GlobalTranslateInstance.open?.({
                    to: 'zh',
                    query: textSelect?.selectedText,
                    e,
                    source: {
                      type: 'pdf',
                      objectId: pdfId,
                      page: pageIndex,
                      selectedText: textSelect.selectedText
                    }
                  })
              }}
              onHighlight={(color, specType) => {
                setTextSelectionToolbarVisible(false)
                pageFunctionRef.current?.clearTextLayer?.()
                ObjectStore('pdfLabel').addOne({
                  page: pageIndex,
                  selectedText: textSelect?.selectedText,
                  type: 'highlight',
                  color,
                  specHighlightType: specType,
                  documentId: pdfId,
                  rects: textSelect?.rects?.map(r => ({
                    percentageTop: r.percentageTop,
                    percentageHeight: r.percentageHeight,
                    percentageLeft: r.percentageLeft,
                    percentageWidth: r.percentageWidth
                  }))
                } as IHighlightLabel)
              }}
              textSelect={textSelect}
            />
          </WithBorder>
        }
      >
        <div
          data-label="text-selection-position-helper"
          style={{
            left: (textSelect && textSelect.rects[0]?.left + textSelect.rects[0]?.width / 2) || 0,
            top: textSelect?.rects[0]?.top || 0,
            position: 'absolute'
          }}
        ></div>
      </AnimatePopover>
    </>
  )
}
export default React.memo(PdfPage)
