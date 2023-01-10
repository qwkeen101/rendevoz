import { Noop } from '@/common/types'
import { AnimatePopover, WithBorder } from '@/components'
import MetaDetailsCard from '@/components/editor/elements/meta/MetaDetailsCard'
import { GlobalDragOverlayInstance } from '@/components/globalDragOverlay'
import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn, useMergedRef } from '@/hooks'
import { PdfScope } from '@/jotai/jotaiScope'
import useMetaStore from '@/stores/meta.store'
import { css } from '@emotion/css'
import { PrimitiveAtom, useAtom } from 'jotai'
import { FC, forwardRef, memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import { IHighlightLabel, MetaKnowledgeObject, MetaLink } from '~/typings/data'
import usePdfInfo from '../../hooks/usePdfInfo'
import LabelToolbar from '../toolbar/LabelToolbar'

interface HighlightLabelProps {
  highlightAtom: PrimitiveAtom<IHighlightLabel>
  onDelete: Noop
}
const layout = ['colorPicker', 'metaObject', 'separator', 'searcher', 'translator', 'separator', 'delete']

const HighlightLabel: FC<HighlightLabelProps> = ({ highlightAtom, onDelete }) => {
  const [highlight, setHighlight] = useAtom(highlightAtom, PdfScope)
  const [popoverVisible, setPopoverVisible] = useState(false)
  const [metaCardVisible, setMetaCardVisible] = useState(false)
  const [metaObject, setMetaObject] = useState<MetaKnowledgeObject>()
  const [pdfInfo] = usePdfInfo()

  const { addMetaObject, getMetaKnowObjectByKeyword, addMetaLink, getMetaObjectByDocumentId } = useMetaStore()

  useEffect(() => {
    if (highlight) {
      const trimedKeyword = highlight.selectedText?.trim()
      if (trimedKeyword) {
        setMetaObject(getMetaKnowObjectByKeyword(trimedKeyword))
      }
    }
  }, [highlight, getMetaKnowObjectByKeyword])
  const highlightRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const emitter = useEventEmitter()
  useClickAway(highlightRef, e => {
    if (!toolbarRef.current?.contains(e.target) && !metaRef.current?.contains(e.target)) {
      setPopoverVisible(false)
      setMetaCardVisible(false)
    }
  })

  const handleColorChange = (color: string) => {
    setHighlight({ ...highlight, color })
  }

  const handleAddToEditor = useMemoizedFn(() => {
    emitter.emit('editor', {
      type: 'insertNode',
      data: {
        element: {
          type: 'highlight',
          originId: highlight.id,
          selectedText: highlight.selectedText,
          children: [{ text: '' }]
        }
      }
    })
  })
  const handleMetaObject = () => {
    if (metaObject === undefined) {
      addMetaObject({
        keyword: highlight.selectedText?.trim()
      }).then(obj => {
        if (pdfInfo) {
          const documentMetaObject = getMetaObjectByDocumentId(pdfInfo.id)
          if (!documentMetaObject) {
            addMetaObject({
              type: 'document',
              documentId: pdfInfo.id,
              title: pdfInfo.metadata?.title || pdfInfo.name
            }).then(docObj => {
              const metaLink: Partial<MetaLink> = {
                sourceId: docObj.id,
                sourceType: 'document',
                targetId: obj.id,
                targetType: 'knowledge',
                label: 'from'
              }
              addMetaLink(metaLink)
              return
            })
          } else {
            const metaLink: Partial<MetaLink> = {
              sourceId: documentMetaObject.id,
              sourceType: 'document',
              targetId: obj.id,
              targetType: 'knowledge',
              label: 'from'
            }
            addMetaLink(metaLink)
          }
        }
        setMetaObject(obj)
      })
    } else {
      setMetaCardVisible(true)
    }
  }
  const mouseDownHandler = useMemoizedFn(() => {
    const ele = document.createElement('div')
    highlight.selectedText && (ele.textContent = highlight.selectedText)
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
      page: highlight.page
    }
    console.log(GlobalDragOverlayInstance)
    document.addEventListener('pointermove', mouseMoveHandler)
    document.addEventListener('pointerup', mouseUpHandler)
  })
  const mouseMoveHandler = useMemoizedFn(() => {
    GlobalDragOverlayInstance?.startDrag()
  })
  const mouseUpHandler = useMemoizedFn(() => {
    GlobalDragOverlayInstance?.endDrag()
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
  return (
    <AnimatePopover
      padding={10}
      boundaryElement={document.body}
      visible={popoverVisible}
      positions={['top']}
      content={
        metaCardVisible ? (
          <WithBorder ref={metaRef}>
            <MetaDetailsCard obj={metaObject} />
          </WithBorder>
        ) : (
          <WithBorder ref={toolbarRef} key={highlight.id}>
            <LabelToolbar
              layout={layout}
              key={highlight.id}
              onColorChange={handleColorChange}
              onMetaObject={handleMetaObject}
              onDelete={onDelete}
              selectedText={highlight.selectedText}
              onAddToEditor={handleAddToEditor}
            />
          </WithBorder>
        )
      }
    >
      <Highlights
        highlight={highlight}
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
  const { highlight, onClick, highlightRef } = props
  const innerRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMergedRef(highlightRef, innerRef, ref)
  useLayoutEffect(() => {
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
        const n = node as HTMLElement
        const computed = window.getComputedStyle(n)
        const ct = parseInt(computed.top)
        const cl = parseInt(computed.left)
        const w = parseInt(computed.width)
        const h = parseInt(computed.height)
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
        n.style.width = computed.width
        n.style.height = computed.height
      })
      container.childNodes.forEach(node => {
        const n = node as HTMLElement
        const computed = window.getComputedStyle(n)
        const ct = parseInt(computed.top)
        const cl = parseInt(computed.left)
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
  }, [])
  return (
    <div
      key={highlight.id}
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
            top: `${rect.percentageTop * 100}%`,
            left: `${rect.percentageLeft * 100}%`,
            width: `${rect.percentageWidth * 100}%`,
            height: `${rect.percentageHeight * 100}%`,
            backgroundColor: highlight.color,
            opacity: 0.3
          }}
        ></div>
      ))}
    </div>
  )
})
export default memo(HighlightLabel)
