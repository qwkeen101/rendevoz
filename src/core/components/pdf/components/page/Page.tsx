import React, { Fragment, useEffect, useRef, useState } from 'react'
import { AnimatePopover, Button, WithBorder } from '@/components'
import { IPdfLabel, RenderPageProps, TextSelectEvent } from '~/typings'
import TextSelectionToolbar from '../toolbar/TextSelectionToolbar'
import HighlightLabel from '../label/HighlightLabel'
import useCleanMode from '../../hooks/useCleanMode'
import { globalStore, ObjectStore } from '@/api/stores'
import usePdfViewer from '../../core/hooks/useViewer'
import { getTextContent } from '../../core/weakMaps'
import { GlobalTranslateInstance } from '@/core/global/translate/GlobalTranslatePanel'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import { objectIdToMetaObjectIdMapAtom } from '@/api/stores/meta/meta.store'
import { useContextmenu } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '@/core/rendevoz'
import usePdfInstance from '../../hooks/usePdfInstance'
import CropLabel from '@/core/components/pdf/components/label/CropLabel'

interface PdfPageProps extends RenderPageProps {
  pdfId: number
  transformScale?: number
}

const PdfPage: React.FC<PdfPageProps> = ({
  containerRef,
  pageIndex,
  textLayer,
  canvasLayer,
  annotationLayer,
  pageFunctionRef,
  pageSize,
  pdfId,
  transformScale
}) => {
  const labelContainerRef = useRef<HTMLDivElement>(null)
  const [cleanMode] = useCleanMode()
  const pdf = ObjectStore('pdf').useValue(pdfId)
  const [allLabels, setAllLabels] = useState<IPdfLabel[]>([])
  useEffect(() => {
    Promise.all(pdf?.labels?.map(i => ObjectStore('pdfLabel').getOneById(i)) || []).then(labels => {
      if (labels) {
        const l = labels.filter(i => i && i.page === pageIndex && i.parentObjectId === pdfId) as IPdfLabel[]

        setAllLabels(l)
      }
    })
  }, [pdf?.labels])

  const [textSelectionToolbarVisible, setTextSelectionToolbarVisible] = useState(false)
  const [textSelect, setTextSelect] = useState<TextSelectEvent>()

  const viewer = usePdfViewer()

  const instance = usePdfInstance()

  const { contextMenuState, closeContextmenu } = useContextmenu(containerRef.current)

  if (pageFunctionRef.current) {
    pageFunctionRef.current.onTextSelected = e => {
      setTextSelect(e)
      setTextSelectionToolbarVisible(true)
    }
    pageFunctionRef.current.onTextSelectEnd = () => {
      setTextSelectionToolbarVisible(false)
    }
    pageFunctionRef.current.onImageCropped = (rect, path) => {
      instance.insertLabel?.({
        type: 'crop',
        rect,
        imageUrl: path,
        page: pageIndex,
        color: 'rgba(39, 158, 255)'
      })
    }
  }
  console.log(transformScale)
  const { t } = useTranslation()
  return (
    <>
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
        ref={labelContainerRef}
        role="custom-element-layer"
      >
        {!cleanMode &&
          allLabels?.map(
            i =>
              i.id && (
                <Fragment key={i.id}>
                  {i.type === 'highlight' && <HighlightLabel documentId={pdfId} labelId={i.id} key={i.id} pageSize={pageSize} />}
                  {i.type === 'crop' && <CropLabel labelId={i.id} pageSize={pageSize} scale={transformScale} />}
                </Fragment>
              )
          )}
      </div>
      {/*<EditorLayer pageIndex={pageIndex} pageSize={pageSize} />*/}
      <AnimatePopover
        visible={contextMenuState.visible}
        align="start"
        positions={['right', 'left']}
        position={{ left: contextMenuState.pageX, top: contextMenuState.pageY }}
        content={
          <WithBorder padding={6}>
            <Button.IconButton
              icon="park-translate"
              text={t('general.translate whole page')}
              onClick={e => {
                closeContextmenu()
                if (viewer) {
                  getTextContent(viewer, pageIndex).then(text => {
                    Rendevoz.Actions.Open.Translate.openTranslate({
                      e,
                      query: text?.textContent.items
                        .map(i => i.str)
                        .filter(i => typeof i === 'string')
                        .join(' '),
                      source: {
                        type: 'pdf',
                        objectId: pdfId,
                        page: pageIndex
                      }
                    })
                  })
                }
              }}
            />
          </WithBorder>
        }
        onClickOutside={closeContextmenu}
        disableIntersection
        padding={10}
      />
      <AnimatePopover
        padding={10}
        borderRadius={5}
        visible={textSelectionToolbarVisible}
        containerStyle={{ zIndex: '9999', borderRadius: '5px' }}
        content={
          <WithBorder borderRadius={5}>
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
                instance.insertLabel?.({
                  page: pageIndex,
                  selectedText: textSelect?.selectedText,
                  type: 'highlight',
                  color,
                  specHighlightType: specType,
                  rects: textSelect?.rects?.map(r => ({
                    percentageTop: parseFloat(r.percentageTop?.toFixed(4) || '0'),
                    percentageHeight: parseFloat(r.percentageHeight?.toFixed(4) || '0'),
                    percentageLeft: parseFloat(r.percentageLeft?.toFixed(4) || '0'),
                    percentageWidth: parseFloat(r.percentageWidth?.toFixed(4) || '0')
                  }))
                })
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
