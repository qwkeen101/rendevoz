import { DraggableElement, DraggingElement, SettingAtom } from '@/core'
import { useMergedRef, useSelectAtomValue, useSelectGlobalAtomValue } from '@/hooks'
import { PageSize } from '~/typings'
import { ObjectStore } from '@/api/stores'
import { CSSProperties, FC, forwardRef, memo, useEffect, useRef, useState } from 'react'
import { ILabel } from '~/typings/data'
import useClickOutside from '@/hooks/utils/useClickOutside'
import { Rect } from '@/types'
import usePdfSelectMode from '../../hooks/useSelectMode'
import { useSetAtom } from 'jotai'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import { Colors } from '@/consts'
import LabelNoteRenderer from '@/core/components/pdf/components/label/LabelNoteRenderer'

interface HighlightLabelProps {
  labelId: number
  pageSize: PageSize
  documentId: number
}
const layout = ['copy', 'colorPicker', 'separator', 'searcher', 'translator', 'rightBar', 'separator', 'delete']

const HighlightLabel: FC<HighlightLabelProps> = memo(
  ({ labelId, pageSize, documentId }) => {
    const highlight = ObjectStore('pdfLabel').useValue(labelId) as (ILabel & { type: 'highlight' }) | undefined
    const highlightRef = useRef<HTMLDivElement>(null)
    const setPdfState = useSetAtom(PdfStateAtom)
    if (!highlight) return null

    return (
      <DraggableElement
        hoverElement={<DraggingElement text="Drop to add pdf label." />}
        draggingDetails={{
          type: 'pdfLabel',
          labelId: highlight.id
        }}
      >
        <Highlights
          highlight={highlight}
          pageSize={pageSize}
          highlightRef={highlightRef}
          labelId={labelId}
          onClick={e => {
            setTimeout(() =>
              setPdfState(s => ({
                ...s,
                currentFocusedLabel: {
                  labelId,
                  position: {
                    x: e.clientX,
                    y: e.clientY
                  }
                }
              }))
            )
          }}
          key={highlight.id}
        />
      </DraggableElement>
      // </AnimatePopover>
    )
  },
  (prev, curr) => {
    return (
      prev.labelId === curr.labelId &&
      prev.pageSize.height === curr.pageSize.height &&
      prev.pageSize.width === curr.pageSize.width &&
      prev.pageSize.scale === curr.pageSize.scale
    )
  }
)
const Highlights = forwardRef((props, ref) => {
  const { highlight, onClick, highlightRef, pageSize, labelId } = props
  const innerRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMergedRef(highlightRef, innerRef, ref)
  const [selectMode] = usePdfSelectMode()
  const [focused, setFocused] = useState(false)
  const darkMode = useSelectGlobalAtomValue(SettingAtom, s => s.general.darkMode)
  const containerRectRef = useRef<Rect>()
  useEffect(() => {
    const container = innerRef.current
    if (container) {
      let containerRect = {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0
      }
      const rectNodes = Array.from(container.childNodes).filter(i => i.hasAttribute('data-rect'))
      rectNodes.forEach((node, idx) => {
        const rect = highlight.rects[idx]
        const n = node as HTMLElement
        const ct = rect.percentageTop * pageSize.height
        const cl = rect.percentageLeft * pageSize.width
        const w = rect.percentageWidth * pageSize.width
        const h = rect.percentageHeight * pageSize.height
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
      rectNodes.forEach((node, idx) => {
        const n = node as HTMLElement
        const rect = highlight.rects[idx]
        const ct = rect.percentageTop * pageSize.height
        const cl = rect.percentageLeft * pageSize.width
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
      containerRectRef.current = containerRect
    }
  }, [pageSize.width, pageSize.height, pageSize.scale])
  const currentHighlightLabelId = useSelectAtomValue(PdfStateAtom, s => s.currentHighlightLabelId)
  useEffect(() => {
    if (currentHighlightLabelId === labelId) {
      setFocused(true)
      return () => {
        setFocused(false)
      }
    }
  }, [currentHighlightLabelId])

  const highlightStyle: CSSProperties =
    highlight.specHighlightType === 'underline'
      ? {
          backgroundImage: `linear-gradient(to left, ${highlight.color}, ${highlight.color} 100%)`,
          backgroundPosition: '0 100%',
          backgroundSize: '100% 2px',
          backgroundRepeat: 'repeat-x'
        }
      : {
          background: Colors.getAdaptColor(highlight.color)
        }
  return (
    <div
      style={{
        pointerEvents: 'none',
        outline: focused ? `2px solid ${Colors.getAdaptColor(highlight.color)}` : undefined,
        borderRadius: 4
      }}
      ref={mergedRef}
      onClick={onClick}
    >
      <LabelNoteRenderer labelId={labelId} />
      {highlight.rects?.map((rect, idx) => (
        <div
          key={idx}
          data-rect={true}
          style={{
            position: 'absolute',
            cursor: 'pointer',
            pointerEvents: selectMode ? 'none' : 'auto',
            opacity: highlight.specHighlightType === 'underline' ? 1 : darkMode ? 0.4 : 0.5,
            ...highlightStyle
          }}
        ></div>
      ))}
    </div>
  )
})
export default memo(HighlightLabel)
