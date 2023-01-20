import { GlobalEventHandler } from '@/events/globalEvent'
import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import { GlobalScope } from '@/jotai/jotaiScope'
import useMetaStore from '@/stores/meta.store'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { atom, useAtom } from 'jotai'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Node } from 'slate'
import { MetaLink, MetaObject } from '~/typings/data'
import Modal from './base/modal'
import { CustomElement } from './editor/types'
import EditMetaObjectForm from './form/EditMetaObjectForm'

export type AvaliableGlobalDraggingElements =
  | {
      type: 'noteElement'
      blockId: number
      element: CustomElement
      elements: CustomElement[]
      content: string
      noteId: number
    }
  // something inside pdf, not pdf itself
  | {
      type: 'pdfElement'
      labelId: number
      pdfId: number
      content: string
      page: number
    }
  | {
      type: 'metaElement'
      metaId: number
    }
  // pdf itself
  | {
      type: 'pdf'
      pdfId: number
    }
  | {
      type: 'collection'
      collectionId: number
    }
  | {
      type: 'note'
      noteId: number
    }
  | {
      type: 'image'
      url: string
    }
interface IGlobalDragOverlay {
  addDragElements: (nodes: HTMLElement | HTMLElement[]) => void
  startDrag: () => void
  endDrag: () => void
  removeDragElements: (nodes: HTMLElement | HTMLElement[]) => void
  removeAllDragElement: () => void
  draggingDetails?: Partial<AvaliableGlobalDraggingElements>
}
export const GlobalDragOverlayInstance: Partial<IGlobalDragOverlay> = {}
const globalIsDraggingAtom = atom(false)
export const useGlobalIsDragging = () => useAtom(globalIsDraggingAtom, GlobalScope)
const GlobalDragOverlay = memo(() => {
  const [dragElements, setDragElements] = useState<HTMLElement[]>([])
  const emitter = useEventEmitter()
  const [isDragging, setIsDragging] = useGlobalIsDragging()
  const dropHandler = useMemo(() => new GlobalEventHandler(), [])
  const [metaObject, setMetaObject] = useState<MetaObject & { noteId?: number }>()
  const { addMetaLink, addMetaObject, getMetaObjectByNoteId, getMetaObjectByDocumentId, getMetaObjectById } = useMetaStore()
  useEffect(() => {
    emitter.addListener('global', dropHandler)
    return () => {
      emitter.removeListener('global', dropHandler)
    }
  }, [dropHandler])
  dropHandler.on(
    'dragDrop',
    useMemoizedFn(async data => {
      const { dragElement, dropOn } = data
      GlobalDragOverlayInstance.draggingDetails = undefined
      const normalizedMetaObject: Partial<MetaObject & { noteId: number }> = {
        id: Id.getId(),
        type: 'normal'
      }
      switch (dragElement?.type) {
        case 'image': {
          normalizedMetaObject.type = 'image'
          normalizedMetaObject.name = `Unnamed image ${Id.getId()}`
          normalizedMetaObject.coverImgSrc = dragElement.url
          break
        }
        case 'pdfElement': {
          normalizedMetaObject.type = 'pdfElement'
          normalizedMetaObject.objectId = dragElement.labelId
          normalizedMetaObject.name = dragElement.content.slice(0, 50) || 'Unnamed object'
          const shouldConcat = dragElement.content.length > 50
          if (shouldConcat) {
            normalizedMetaObject.name = normalizedMetaObject.name.concat('...')
          }
          normalizedMetaObject.description = dragElement.content
          normalizedMetaObject.pdfId = dragElement.pdfId
          const pdfMeta =
            (await getMetaObjectByDocumentId(dragElement.pdfId)) || (await addMetaObject({ type: 'pdf', objectId: dragElement.pdfId }))
          const metaLink: MetaLink = {
            sourceId: pdfMeta.id,
            targetId: normalizedMetaObject.id
          }
          setTimeout(() => addMetaLink(metaLink), 100)
          break
        }
        case 'noteElement': {
          normalizedMetaObject.type = 'noteElement'
          normalizedMetaObject.objectId = dragElement.blockId
          const content = dragElement.elements ? dragElement.elements.map(n => Node.string(n)).join(' ') : Node.string(dragElement.element)
          normalizedMetaObject.name = content?.slice(0, 50) || 'Unnamed object'
          const shouldConcat = dragElement.content.length > 50
          if (shouldConcat) {
            normalizedMetaObject.name = normalizedMetaObject.name.concat('...')
          }
          normalizedMetaObject.description = content
          normalizedMetaObject.noteId = dragElement.noteId
          break
        }
        case 'metaElement': {
          normalizedMetaObject.id = dragElement.metaId
        }
      }
      switch (dropOn) {
        case 'database': {
          setMetaObject(normalizedMetaObject)
          break
        }
        case 'editor': {
          const { note } = data
          if (!note) break
          const { id: noteId, metaId } = note
          const noteMeta = metaId
            ? await getMetaObjectById(metaId)
            : (await getMetaObjectByNoteId(noteId)) ||
              (await addMetaObject({
                objectId: noteId,
                type: 'note'
              }))

          if (!noteMeta) break
          const forbidAddNewMetaObjectTypes = ['collection', 'metaElement']
          const shouldAdd = dragElement?.type && !forbidAddNewMetaObjectTypes.includes(dragElement.type)
          setTimeout(() => {
            shouldAdd && addMetaObject(normalizedMetaObject)
          }, 100)
          const metaLink: Partial<MetaLink> = {
            sourceId: normalizedMetaObject.id!,
            targetId: noteMeta.id
          }
          addMetaLink(metaLink)
          break
        }
        case 'pdf':
          return
      }
    })
  )
  const dragContainerRef = useRef<HTMLDivElement>(null)
  const dragHandler = useMemoizedFn((e: MouseEvent) => {
    if (e.type === 'pointerup') {
      setDragElements([])
      setTimeout(() => setIsDragging(false), 0)
      setTimeout(() => (GlobalDragOverlayInstance.draggingDetails = undefined), 20)
      return
    }
    e.preventDefault()
    const dragContainer = dragContainerRef.current
    if (!dragContainer) return
    const { clientX, clientY } = e
    dragContainer.style.transform = `translateX(${clientX}px) translateY(${clientY}px)`
    dragContainer.style.display = 'block'
  })

  useEffect(() => {
    const dragContainer = dragContainerRef.current
    if (!dragContainer) return
    document.addEventListener('pointerup', dragHandler, true)
    if (isDragging) {
      document.body.style.cursor = 'grabbing'
      document.addEventListener('pointermove', dragHandler, true)
    } else {
      document.body.style.cursor = 'auto'
      document.removeEventListener('pointermove', dragHandler, true)
      dragContainer.style.display = 'none'
      // GlobalDragOverlayInstance.draggingDetails = undefined
    }
    return () => {
      document.removeEventListener('pointerup', dragHandler, true)
    }
  }, [isDragging])
  useEffect(() => {
    if (dragElements.length === 0) {
      while (dragContainerRef.current?.firstChild) {
        dragContainerRef.current.removeChild(dragContainerRef.current.firstChild)
      }
    } else {
      dragContainerRef.current?.replaceChildren(...dragElements)
    }
  }, [dragElements])
  Object.assign(GlobalDragOverlayInstance, {
    addDragElements: nodes => {
      if (!Array.isArray(nodes)) {
        nodes = [nodes]
      }
      if (!isDragging) {
        setDragElements([...dragElements, ...nodes])
      }
    },
    removeAllDragElement: () => {
      setDragElements([])
    },
    removeDragElements: nodes => {
      if (!Array.isArray(nodes)) {
        nodes = [nodes]
      }
      setDragElements(els => {
        return els.filter(el => (nodes as HTMLElement[]).some(n => n !== el))
      })
    },
    startDrag: () => {
      setIsDragging(true)
    },
    endDrag: () => {
      setIsDragging(false)
    }
  } as Partial<IGlobalDragOverlay>)
  return createPortal(
    <>
      <Modal width={400} visible={!!metaObject} onClose={() => setMetaObject(undefined)}>
        <EditMetaObjectForm
          onUpdate={async obj => {
            const noteId = obj.noteId
            const pdfId = obj.pdfId
            obj.noteId && delete obj.noteId
            obj.pdfId && delete obj.pdfId
            addMetaObject(obj)
            if (obj.type === 'noteElement' && noteId) {
              const noteMeta =
                (await getMetaObjectByNoteId(noteId)) ||
                (await addMetaObject({
                  objectId: noteId,
                  type: 'note'
                }))

              const metaLink: Partial<MetaLink> = {
                sourceId: obj.id,
                targetId: noteMeta.id
              }
              addMetaLink(metaLink)
            }
            if (obj.type === 'pdfElement' && pdfId) {
              const pdfMeta = (await getMetaObjectByDocumentId(pdfId)) || (await addMetaObject({ objectId: pdfId, type: 'pdf' }))
              const metaLink: Partial<MetaLink> = {
                sourceId: obj.id,
                targetId: pdfMeta.id
              }
              addMetaLink(metaLink)
            }
            setMetaObject(undefined)
          }}
          title="Create new meta object"
          metaObject={metaObject}
        />
      </Modal>
      <div
        className={css({
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          pointerEvents: 'none'
        })}
        role="global-drag-overlay"
      >
        <div style={{ opacity: 0.5 }} ref={dragContainerRef}></div>
      </div>
    </>,
    document.body,
    'globla-drag-overlay'
  )
})

export default GlobalDragOverlay
