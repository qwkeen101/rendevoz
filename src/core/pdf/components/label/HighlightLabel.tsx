import { AnimatePopover, WithBorder } from '@/components'
import { DraggableElement, DraggingElement } from '@/core'
import { useMergedRef } from '@/hooks'
import { PageSize } from '~/typings'
import { ObjectStore, globalStore } from '@/stores'
import { CSSProperties, FC, forwardRef, memo, useEffect, useMemo, useRef, useState } from 'react'
import { ILabel } from '~/typings/data'
import LabelToolbar from '../toolbar/LabelToolbar'
import usePdfViewer from '@/core/pdf/core/hooks/useViewer'
import useClickOutside from '@/hooks/utils/useClickOutside'
import tinycolor from 'tinycolor2'
import { ID_TO_LABEL_MAP } from '../../weakMaps'
import { Rect } from '@/types'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import { Rendevoz } from '@/core/rendevoz'

interface HighlightLabelProps {
  labelId: number
  pageSize: PageSize
  documentId: number
}
const layout = ['copy', 'colorPicker', 'separator', 'searcher', 'translator', 'separator', 'delete']

const HighlightLabel: FC<HighlightLabelProps> = memo(
  ({ labelId, pageSize, documentId }) => {
    const highlight = ObjectStore('pdfLabel').useValue(labelId) as (ILabel & { type: 'highlight' }) | undefined
    const [popoverVisible, setPopoverVisible] = useState(false)
    const highlightRef = useRef<HTMLDivElement>(null)
    const metaRef = useRef<HTMLDivElement>(null)
    const toolbarRef = useRef<HTMLDivElement>(null)

    useClickOutside(
      e => {
        if (!toolbarRef.current?.contains(e.target) && !metaRef.current?.contains(e.target)) {
          setPopoverVisible(false)
        }
      },
      highlightRef,
      popoverVisible
    )

    const handleColorChange = (color: string) => {
      ObjectStore('pdfLabel').updateOne({ id: labelId, color })
    }

    if (!highlight) return null

    return (
      <AnimatePopover
        padding={10}
        boundaryElement={document.body}
        visible={popoverVisible}
        positions={['top']}
        containerStyle={{ borderRadius: '999px' }}
        content={
          <WithBorder ref={toolbarRef} key={highlight.id} padding="0px 12px" borderRadius={999}>
            <LabelToolbar
              layout={layout}
              key={highlight.id}
              onColorChange={handleColorChange}
              onTranslate={e => {
                highlight.selectedText &&
                  Rendevoz.Actions.Open.Translate.openTranslate({
                    to: 'zh',
                    query: highlight.selectedText,
                    e,
                    source: {
                      type: 'pdf',
                      objectId: highlight.documentId,
                      page: highlight.page,
                      selectedText: highlight.selectedText
                    }
                  })
              }}
              onSearch={e => {
                const pdfMetaId = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(documentId)
                if (pdfMetaId) {
                  GlobalSearchInstance.open?.({
                    e,
                    query: highlight?.selectedText,
                    from: {
                      pages: [highlight.page],
                      type: 'pdf',
                      metaId: pdfMetaId,
                      selectedText: highlight?.selectedText
                    }
                  })
                }
              }}
              onDelete={() => ObjectStore('pdfLabel').deleteOneById(labelId, { force: true })}
              selectedText={highlight.selectedText}
            />
          </WithBorder>
        }
      >
        <DraggableElement
          hoverElement={<DraggingElement text="Drop to add pdf label." />}
          draggingDetails={{
            type: 'pdfLabel',
            pdfId: documentId,
            content: highlight.selectedText,
            page: highlight.page,
            labelId: highlight.id
          }}
        >
          <Highlights
            highlight={highlight}
            pageSize={pageSize}
            highlightRef={highlightRef}
            labelId={labelId}
            onClick={() => {
              setPopoverVisible(true)
            }}
            key={highlight.id}
          />
        </DraggableElement>
      </AnimatePopover>
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
  const viewer = usePdfViewer()
  const [focused, setFocused] = useState(false)
  useClickOutside(() => setFocused(false), highlightRef, focused)
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
      container.childNodes.forEach((node, idx) => {
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
      container.childNodes.forEach((node, idx) => {
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
  useEffect(() => {
    if (viewer) {
      ID_TO_LABEL_MAP.get(viewer)?.set(labelId, {
        focus: () => {
          setTimeout(() => {
            setFocused(true)
          })
        }
      })
      viewer.onLabelRendered?.(labelId)
      return () => {
        ID_TO_LABEL_MAP.get(viewer)?.delete(labelId)
      }
    }
  }, [])
  const darkenColor = useMemo(() => {
    const color = tinycolor(highlight.color || '#8590ae')
    const darkenColor = color.darken(20).toString('rgb')
    return darkenColor
  }, [highlight.color])
  const highlightStyle: CSSProperties =
    highlight.specHighlightType === 'underline'
      ? {
          backgroundImage: `linear-gradient(to left, ${highlight.color}, ${highlight.color} 100%)`,
          backgroundPosition: '0 100%',
          backgroundSize: '100% 3px',
          backgroundRepeat: 'repeat-x'
        }
      : {
          background: highlight.color
        }
  return (
    <div
      style={{
        pointerEvents: 'none',
        outline: focused ? `2px solid ${darkenColor}` : undefined,
        borderRadius: 4
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
            opacity: 0.4,
            ...highlightStyle
          }}
        ></div>
      ))}
    </div>
  )
})
export default memo(HighlightLabel)
