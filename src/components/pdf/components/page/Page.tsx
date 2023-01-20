import { Box, SelectionBox } from '@/components/dragSelector'
import React, { useCallback, useRef, useState } from 'react'
import DragSelection from './mouseSelection'
import html2canvas from 'html2canvas'
import { PdfLabelsAtoms, usePdfLabels, usePdfNote } from '../../hooks/usePdfNote'
import ContextMenu, { ContextMenuRef } from '@/components/contextMenu'
import PdfContextMenu from '@/components/menus/PdfContextMenu'
import ThoughtLabel from '../label/Label'
import { WithBorder } from '@/components'
import { useIntersection, useIsomorphicLayoutEffect } from 'react-use'
import { RenderPageProps } from '@/pdfViewer/core/types'
import styles from './index.module.less'
import { AnimatePopover } from '@/components'
import { PdfEventHandler, TextSelectEvent } from '@/events/pdfEvent'
import useEventEmitter from '@/events/useEventEmitter'
import TextSelectionToolbar from '../toolbar/TextSelectionToolbar'
import Id from '@/utils/id'
import HighlightLabel from '../label/HighlightLabel'
import { useTime } from '@/hooks'
import { useAtomValue } from 'jotai'
import useCleanMode from '../../hooks/useCleanMode'
import PdfViewerToolMenu from '@/components/menus/PdfViewerToolMenu'

interface PdfPageProps extends RenderPageProps {
  onCanvasLayerClick?: (e: React.MouseEvent) => void
  onCanvasLayerDrag?: (e: SelectionBox) => void
  onCanvasLayerDragEnd?: (e: string | undefined) => void
  onTextSelectionClick?: (e: ITextSelectionLabel) => void
  enableCrop?: boolean
  textLayerVisible?: boolean
}

const PdfPage: React.FC<PdfPageProps> = ({
  enableCrop,
  textLayerVisible,
  onCanvasLayerDrag,
  onCanvasLayerDragEnd,
  pageIndex,
  textLayer,
  canvasLayer,
  pageElement,
  annotationLayer,
  onCanvasLayerClick,
  onTextSelectionClick,
  pageFunctionRef
}) => {
  const thisRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<Box>()
  const labelContainerRef = useRef<HTMLDivElement>(null)
  const [cleanMode] = useCleanMode()
  const [thoughts, dispatchThoughts] = usePdfLabels(pageIndex, 'thought')
  const [highlights, dispatchHighlights] = usePdfLabels(pageIndex, 'highlight')
  const [textSelectionToolbarVisible, setTextSelectionToolbarVisible] = useState(false)
  const intersection = useIntersection(labelContainerRef, { root: null, rootMargin: '1px', threshold: 0 })
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

  const handleSelectionChange = useCallback((box: Box) => {
    onCanvasLayerDrag(box)
    boxRef.current = box
    console.log(box)
  }, [])
  const handleSelectionEnd = useCallback(() => {
    if (thisRef.current && enableCrop) {
      html2canvas(thisRef.current).then(canvas => {
        const newCanvas = document.createElement('canvas')
        newCanvas.height = thisRef.current.clientHeight
        newCanvas.width = thisRef.current.clientWidth
        const newCanvasContext = newCanvas.getContext('2d')
        newCanvasContext?.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, newCanvas.width, newCanvas.height)
        const croppedCanvas = document.createElement('canvas')
        const croppedCanvasContext = croppedCanvas.getContext('2d')
        const { left, top, height, width } = boxRef.current
        croppedCanvas.width = width
        croppedCanvas.height = height
        if (croppedCanvasContext) {
          croppedCanvasContext.drawImage(newCanvas, left, top, width, height, 0, 0, width, height)
        }
        if (croppedCanvas) {
          const url = croppedCanvas.toDataURL()
          onCanvasLayerDragEnd(url)
        }
      })
    }
    onCanvasLayerDragEnd(undefined)
  }, [enableCrop])

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
        {intersection?.isIntersecting && !cleanMode && (
          <>
            {thoughts?.map(i => (
              <ThoughtLabel
                key={`${i.toString()}`}
                thoughtAtom={i}
                dragBoundRef={pageElement}
                onDelete={() => {
                  dispatchThoughts({ type: 'remove', atom: i })
                }}
              />
            ))}
            {highlights.map(i => (
              <HighlightLabel key={`${i}`} highlightAtom={i} onDelete={() => dispatchHighlights({ type: 'remove', atom: i })} />
            ))}
          </>
        )}
      </div>
      <AnimatePopover
        padding={10}
        visible={textSelectionToolbarVisible}
        containerStyle={{ zIndex: '9999' }}
        content={
          <WithBorder>
            <TextSelectionToolbar
              onHighlight={color => {
                setTextSelectionToolbarVisible(false)
                pageFunctionRef.current?.clearTextLayer?.()
                dispatchHighlights({
                  type: 'insert',
                  value: {
                    page: pageIndex,
                    selectedText: textSelect?.selectedText,
                    type: 'highlight',
                    id: Id.getId(),
                    color,
                    createTime: useTime(),
                    modifyTime: useTime(),
                    rects: textSelect?.rects?.map(r => ({
                      percentageTop: r.percentageTop,
                      percentageHeight: r.percentageHeight,
                      percentageLeft: r.percentageLeft,
                      percentageWidth: r.percentageWidth
                    }))
                  }
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
