import { useSelectAtomValue } from '@/hooks'
import { IPDFLabel } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { CSSProperties, FC, memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Rect } from '@/types'
import { useSetAtom } from 'jotai'
import { PDFStateAtom } from '@/core/components/pdf/hooks/usePDFState'
import { Colors } from '@/consts'
import { Icon } from '@/components'

interface HighlightLabelProps {
  labelId: number
  width: number
  height: number
}
const HighlightLabel: FC<HighlightLabelProps> = memo(
  ({ labelId, width, height }) => {
    const highlight = ObjectStore('pdfLabel').useValue(labelId) as (IPDFLabel & { type: 'highlight' }) | undefined
    const highlightRef = useRef<HTMLDivElement>(null)
    const setPdfState = useSetAtom(PDFStateAtom)
    const highlightMeta = MetaStore.useObjectToMetaValue(labelId)
    const selectMode = useSelectAtomValue(PDFStateAtom, s => s.selectMode)
    const [focused, setFocused] = useState(false)
    const containerRectRef = useRef<Rect>()
    useLayoutEffect(() => {
      if (!highlight?.rects) return
      const container = highlightRef.current
      if (container) {
        let containerRect = {
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          right: 0,
          bottom: 0
        }
        const rectNodes = Array.from(container.childNodes).filter(i => (i as HTMLElement).hasAttribute('data-rect'))
        rectNodes.forEach((node, idx) => {
          const rect = highlight.rects[idx]
          const n = node as HTMLElement
          const ct = rect.percentageTop * height
          const cl = rect.percentageLeft * width
          const w = rect.percentageWidth * width
          const h = rect.percentageHeight * height
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
          const ct = rect.percentageTop * height
          const cl = rect.percentageLeft * width
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
    }, [width, height])
    const currentHighlightLabelId = useSelectAtomValue(PDFStateAtom, s => s.currentHighlightLabelId)
    useEffect(() => {
      if (currentHighlightLabelId === labelId) {
        setFocused(true)
        return () => {
          setFocused(false)
        }
      }
    }, [currentHighlightLabelId])
    const adaptColor = highlight?.color
    const highlightStyle: CSSProperties =
      highlight?.specHighlightType === 'underline'
        ? {
            backgroundImage: `linear-gradient(to left, ${adaptColor}, ${adaptColor} 100%)`,
            backgroundPosition: '0 100%',
            backgroundSize: '100% 2px',
            backgroundRepeat: 'repeat-x'
          }
        : {
            background: `linear-gradient(0deg, ${adaptColor} 0%, ${adaptColor} 1px, rgb(from ${adaptColor} r g b / 0.2) 1px, rgb(from ${adaptColor} r g b / 0.2) 100%)`
          }
    if (!highlight) return null
    if (highlightMeta?.deleted) return null
    return (
      <div
        style={{
          pointerEvents: 'none',
          outline: focused ? `2px solid ${Colors.getAdaptColor(highlight.color)}` : undefined,
          borderRadius: 4
        }}
        ref={highlightRef}
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
      >
        {highlightMeta?.name && (
          <Icon
            name={'park-message'}
            style={{
              position: 'absolute',
              top: -16,
              left: -16,
              zIndex: 100,
              transform: 'rotateY(180deg)',
              pointerEvents: 'none'
            }}
            size={16}
            theme={'filled'}
            className={'text-yellow-500'}
          />
        )}
        {highlight.rects?.map((rect, idx) => (
          <div
            key={idx}
            data-rect={true}
            style={{
              position: 'absolute',
              cursor: 'pointer',
              pointerEvents: selectMode ? 'none' : 'auto',
              ...highlightStyle
            }}
          ></div>
        ))}
      </div>
    )
  },
  (prev, curr) => {
    return prev.labelId === curr.labelId && prev.height === curr.height && prev.width === curr.width
  }
)
export default memo(HighlightLabel)
