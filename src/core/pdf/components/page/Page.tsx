import React, { Fragment, useMemo, useRef, useState } from 'react'
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
import ShapeLabel from '../label/ShapeLabel'
import ObjectLabel from '../label/ObjectLabel'

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
  if (pageFunctionRef.current) {
    pageFunctionRef.current.onTextSelected = e => {
      setTextSelect(e)
      setTextSelectionToolbarVisible(true)
    }
    pageFunctionRef.current.onTextSelectEnd = () => {
      setTextSelectionToolbarVisible(false)
    }
  }
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
          labels?.map(
            i =>
              i.id && (
                <Fragment key={i.id}>
                  {i.type === 'highlight' && <HighlightLabel documentId={pdfId} labelId={i.id} key={i.id} pageSize={pageSize} />}
                  {i.type === 'thought' && <ThoughtLabel dragBoundRef={labelContainerRef} labelId={i.id} key={i.id} />}
                  {i.type === 'shape' && <ShapeLabel documentId={pdfId} labelId={i.id} key={i.id} pageSize={pageSize} />}
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
              onHighlight={color => {
                setTextSelectionToolbarVisible(false)
                pageFunctionRef.current?.clearTextLayer?.()
                ObjectStore('pdfLabel').addOne({
                  page: pageIndex,
                  selectedText: textSelect?.selectedText,
                  type: 'highlight',
                  color,
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
