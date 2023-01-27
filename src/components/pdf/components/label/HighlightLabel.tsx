import { AnimatePopover, WithBorder } from '@/components'
import { GlobalDragOverlayInstance } from '@/components/GlobalDragOverlay'
import { useMemoizedFn, useMergedRef } from '@/hooks'
import useLabelStore, { labelsAtom } from '@/stores/label.store'
import { globalStore } from '@/stores/stores'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { FC, forwardRef, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import { IHighlightLabel } from '~/typings/data'
import usePdfInfo from '../../hooks/usePdfInfo'
import LabelToolbar from '../toolbar/LabelToolbar'

interface HighlightLabelProps {
  labelId: number
  pageSize: any
}
const layout = ['colorPicker', 'separator', 'searcher', 'translator', 'separator', 'delete']

const HighlightLabel: FC<HighlightLabelProps> = ({ labelId, pageSize }) => {
  const highlightAtom = useMemo(() => atom(get => get(labelsAtom).get(labelId)), [labelId])
  const highlight = useAtomValue(highlightAtom, { store: globalStore }) as IHighlightLabel | undefined
  const { updateLabel, deleteLabel } = useLabelStore()
  const [popoverVisible, setPopoverVisible] = useState(false)
  const [pdfInfo] = usePdfInfo()

  const highlightRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  useClickAway(highlightRef, e => {
    if (!toolbarRef.current?.contains(e.target) && !metaRef.current?.contains(e.target)) {
      setPopoverVisible(false)
    }
  })

  const handleColorChange = (color: string) => {
    updateLabel({ id: labelId, color })
  }

  const mouseDownHandler = useMemoizedFn(() => {
    const ele = document.createElement('div')
    highlight?.selectedText && (ele.textContent = highlight.selectedText)
    const className = css({
      minWidth: 200,
      maxWidth: 300,
      borderRadius: 7,
      background: 'white',
      border: '1px solid #e0e0e0',
      padding: '6px 16px'
    })
    ele.className = className
    GlobalDragOverlayInstance.addDragElements?.(ele)
    GlobalDragOverlayInstance.draggingDetails = {
      type: 'pdfElement',
      pdfId: pdfInfo?.id,
      content: highlight.selectedText,
      page: highlight.page,
      labelId: highlight.id
    }
    document.addEventListener('pointermove', mouseMoveHandler)
    document.addEventListener('pointerup', mouseUpHandler)
  })
  const mouseMoveHandler = useMemoizedFn(() => {
    GlobalDragOverlayInstance.startDrag?.()
  })
  const mouseUpHandler = useMemoizedFn(() => {
    document.removeEventListener('pointermove', mouseMoveHandler)
    document.removeEventListener('pointerup', mouseUpHandler)
  })
  useLayoutEffect(() => {
    if (highlightRef.current) {
      const container = highlightRef.current
      container.addEventListener('pointerdown', mouseDownHandler)
      return () => {
        container.removeEventListener('pointerdown', mouseDownHandler)
      }
    }
  })
  if (!highlight) return null
  return (
    <AnimatePopover
      padding={10}
      boundaryElement={document.body}
      visible={popoverVisible}
      positions={['top']}
      content={
        <WithBorder ref={toolbarRef} key={highlight.id}>
          <LabelToolbar
            layout={layout}
            key={highlight.id}
            onColorChange={handleColorChange}
            onDelete={() => deleteLabel(labelId)}
            selectedText={highlight.selectedText}
          />
        </WithBorder>
      }
    >
      <Highlights
        highlight={highlight}
        pageSize={pageSize}
        highlightRef={highlightRef}
        onClick={() => {
          setPopoverVisible(true)
        }}
        key={highlight.id}
      />
    </AnimatePopover>
  )
}
const Highlights = forwardRef((props, ref) => {
  const { highlight, onClick, highlightRef, pageSize } = props
  const innerRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMergedRef(highlightRef, innerRef, ref)
  useEffect(() => {
    const container = innerRef.current
    const parentContainer = container?.parentElement
    if (container && parentContainer) {
      let containerRect = {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0
      }
      const parentContainerBound = parentContainer.getBoundingClientRect()
      container.childNodes.forEach((node, idx) => {
        const rect = highlight.rects[idx]
        const n = node as HTMLElement
        const ct = rect.percentageTop * parentContainerBound.height
        const cl = rect.percentageLeft * parentContainerBound.width
        const w = rect.percentageWidth * parentContainerBound.width
        const h = rect.percentageHeight * parentContainerBound.height
        const bottom = ct + h
        const right = cl + w

        if (idx === 0) {
          containerRect = {
            top: ct,
            left: cl,
            bottom,
            right
          }
        } else {
          containerRect.top = Math.min(containerRect.top, ct)
          containerRect.left = Math.min(containerRect.left, cl)
          containerRect.right = Math.max(containerRect.right, right)
          containerRect.bottom = Math.max(containerRect.bottom, bottom)
        }
        n.style.width = `${w}px`
        n.style.height = `${h}px`
      })
      container.childNodes.forEach((node, idx) => {
        const n = node as HTMLElement
        const rect = highlight.rects[idx]
        const ct = rect.percentageTop * parentContainerBound.height
        const cl = rect.percentageLeft * parentContainerBound.width
        n.style.left = `${cl - containerRect.left}px`
        n.style.top = `${ct - containerRect.top}px`
      })
      containerRect.width = containerRect.right - containerRect.left
      containerRect.height = containerRect.bottom - containerRect.top
      container.style.height = `${containerRect.height}px`
      container.style.width = `${containerRect.width}px`
      container.style.left = `${containerRect.left}px`
      container.style.top = `${containerRect.top}px`
      container.style.position = 'absolute'
    }
  }, [pageSize])
  return (
    <div
      style={{
        pointerEvents: 'none'
      }}
      ref={mergedRef}
      onClick={onClick}
    >
      {highlight.rects?.map((rect, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            pointerEvents: 'auto',
            background: highlight.color,
            opacity: 0.4
          }}
        ></div>
      ))}
    </div>
  )
})
export default memo(HighlightLabel)
