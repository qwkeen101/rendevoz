import { DropOn, GlobalEventHandler } from '@/events/globalEvent'
import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useToggle } from '@/hooks'
import { indexedMetaLinksAtom } from '@/stores/meta.store'
import { globalStore, MetaStore } from '@/stores'
import { PartialWithId } from '@/types'
import Id from '@/utils/id'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-hot-toast'
import { Node } from 'slate'
import { MetaLink, MetaObject } from '~/typings/data'
import Modal from '../base/Modal'
import getSetting from '../globalSetting/getSetting'
import { intersectionOfMultipleSets } from '../database/filter/useObjectFilter'
import { AvaliableGlobalDraggingElements } from './GlobalDragOverlay'
import ObjectForm from '../form/ObjectForm'

const useOverlayDrop = () => {
  const emitter = useGlobalEventEmitter()
  const dropHandler = useMemo(() => new GlobalEventHandler(), [])
  const { addMetaLink, addMetaObject, getMetaObjectById, getMetaObjectByObjectId, deleteMetaLink, deleteMetaObject, updateMetaObject } =
    MetaStore
  const [metaObject, setMetaObject] = useState<MetaObject & { noteId?: number }>()
  const [pendingLinks, setPendingLinks] = useState<Partial<MetaLink>[]>([])
  const [editMetaVisible, toggleEditMetaVisible] = useToggle(false)
  const promiseRef = useRef<{
    res: (value: unknown) => void | undefined
    rej: (value: unknown) => void | undefined
  }>()

  dropHandler.on('globalDropNeedFurtherProcess', async (data, res, rej) => {
    if (data.draggingElement) {
      const { dropOn } = data
      const { normalizedMetaObject, shouldOpenEditMetaModal, alreadyHasMeta, preLinks } = await normalizeDraggingEleToMetaObject(
        data.draggingElement
      )
      let postLink: PartialWithId<MetaLink> | undefined
      if (dropOn && normalizedMetaObject) {
        postLink = await getDropOnPostLinks(dropOn, normalizedMetaObject)
      }
      const allPendingLinks = [...preLinks, postLink].filter(i => i !== undefined && i.sourceId && i.targetId) as PartialWithId<MetaLink>[]

      if (shouldOpenEditMetaModal === false || alreadyHasMeta) {
        res?.(normalizedMetaObject)
        allPendingLinks.forEach(i => addMetaLink(i))
        return
      }
      promiseRef.current = {
        res,
        rej
      }
      allPendingLinks.forEach(i => addMetaLink(i, true))
      setPendingLinks(allPendingLinks)
      setMetaObject(normalizedMetaObject)
      addMetaObject(normalizedMetaObject, true)
      toggleEditMetaVisible(true)
    }
  })
  const getDropOnPostLinks = async (dropOn: DropOn, metaObject: MetaObject) => {
    const link: PartialWithId<MetaLink> = {
      id: Id.getId(),
      sourceId: metaObject.id
    }
    switch (dropOn.dropOn) {
      case 'database': {
        break
      }
      case 'editor': {
        const noteMeta =
          (await getMetaObjectByObjectId(dropOn.noteId)) || (await addMetaObject({ id: Id.getId(), objectId: dropOn.noteId, type: 'note' }, true))
        link.targetId = noteMeta.id
        break
      }
      case 'pdf': {
        const pdfMeta =
          (await getMetaObjectByObjectId(dropOn.pdfId)) || (await addMetaObject({ id: Id.getId(), objectId: dropOn.pdfId, type: 'pdf' }, true))
        link.targetId = pdfMeta.id
        break
      }
      case 'whiteboard': {
        const whiteboardMeta =
          (await getMetaObjectByObjectId(dropOn.whiteboardId)) || (await addMetaObject({ id: Id.getId(), objectId: dropOn.whiteboardId, type: 'whiteboard' }, true))
        link.targetId = whiteboardMeta.id
        break
      }
    }
    if (link.sourceId && link.targetId) {
      return link
    }
  }
  const normalizeDraggingEleToMetaObject = async (
    dragElement: AvaliableGlobalDraggingElements
  ): Promise<{
    normalizedMetaObject: MetaObject
    alreadyHasMeta: boolean
    shouldOpenEditMetaModal: boolean
    preLinks: PartialWithId<MetaLink>[]
  }> => {
    const normalizedLinks: PartialWithId<MetaLink>[] = []
    const normalizedMetaObject: PartialWithId<MetaObject & { noteId: number }> = {
      id: Id.getId(),
      type: 'normal'
    }
    let alreadyHasMeta = false
    let shouldOpenEditMetaModal = true
    switch (dragElement?.type) {
      case 'image': {
        normalizedMetaObject.type = 'image'
        normalizedMetaObject.name = `Unnamed image ${Id.getId()}`
        normalizedMetaObject.coverImgSrc = dragElement.url
        break
      }
      case 'pdf': {
        const pdfMeta =
          (await getMetaObjectByObjectId(dragElement.pdfId)) || (await addMetaObject({ type: 'pdf', objectId: dragElement.pdfId }, true))
        Object.assign(normalizedMetaObject, pdfMeta)
        alreadyHasMeta = true
        shouldOpenEditMetaModal = false
        break
      }
      case 'note': {
        const noteMeta =
          (await getMetaObjectByObjectId(dragElement.noteId)) || (await addMetaObject({ type: 'note', objectId: dragElement.noteId }, true))
        Object.assign(normalizedMetaObject, noteMeta)
        alreadyHasMeta = true
        shouldOpenEditMetaModal = false
        break
      }
      case 'pdfElement': {
        const labelMeta = getMetaObjectByObjectId(dragElement.labelId)
        const pdfMeta =
          (await getMetaObjectByObjectId(dragElement.pdfId)) || (await addMetaObject({ type: 'pdf', objectId: dragElement.pdfId }, true))
        if (labelMeta) {
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          const linkIndex = globalStore.get(indexedMetaLinksAtom)
          if (linkIndex) {
            const sourceToLinks = linkIndex.sourceIdToLinkIdsMap.get(pdfMeta.id)
            const targetToLinks = linkIndex.targetIdToLinkIdMap.get(labelMeta.id)
            if (sourceToLinks && targetToLinks) {
              const size = intersectionOfMultipleSets(sourceToLinks, targetToLinks).size
              if (size === 0) {
                addMetaLink({
                  sourceId: pdfMeta.id,
                  targetId: labelMeta.id
                })
              }
            }
          }
          Object.assign(normalizedMetaObject, labelMeta)
        } else {
          normalizedMetaObject.type = 'pdfElement'
          normalizedMetaObject.objectId = dragElement.labelId
          normalizedMetaObject.name = dragElement.content?.slice(0, 50) || 'Unnamed Label'
          const shouldConcat =  dragElement.content && dragElement.content?.length > 50
          if (shouldConcat) {
            normalizedMetaObject.name = normalizedMetaObject.name.concat('...')
          }
          normalizedMetaObject.description = dragElement.content
          const metaLink: PartialWithId<MetaLink> = {
            sourceId: pdfMeta.id,
            targetId: normalizedMetaObject.id,
            id: Id.getId()
          }
          normalizedLinks.push(metaLink)
        }

        break
      }
      case 'noteElement': {
        if (dragElement.metaId) {
          const meta = await getMetaObjectById(dragElement.metaId)
          if (meta) {
            Object.assign(normalizedMetaObject, meta)
            shouldOpenEditMetaModal = false
            alreadyHasMeta = true
            break
          }
        }
        const noteMeta =
          (await getMetaObjectByObjectId(dragElement.noteId)) || (await addMetaObject({ type: 'note', objectId: dragElement.noteId }, true))
        const noteBlockMeta = getMetaObjectByObjectId(dragElement.blockId)
        if (noteBlockMeta) {
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          const linkIndex = globalStore.get(indexedMetaLinksAtom)
          if (linkIndex) {
            const sourceToLinks = linkIndex.sourceIdToLinkIdsMap.get(noteMeta.id)
            const targetToLinks = linkIndex.targetIdToLinkIdMap.get(noteBlockMeta.id)
            if (sourceToLinks && targetToLinks) {
              const size = intersectionOfMultipleSets(sourceToLinks, targetToLinks).size
              if (size === 0) {
                addMetaLink({
                  sourceId: noteMeta.id,
                  targetId: noteBlockMeta.id
                })
              }
            }
          }
          Object.assign(normalizedMetaObject, noteBlockMeta)
        } else {
          normalizedMetaObject.type = 'noteElement'
          normalizedMetaObject.objectId = dragElement.blockId
          const content = dragElement.elements
            ? dragElement.elements.map(n => Node.string(n)).join('\r\n')
            : Node.string(dragElement.element)
          normalizedMetaObject.name = content?.slice(0, 50) || 'Unnamed object'
          const shouldConcat = dragElement.content?.length > 50
          if (shouldConcat) {
            normalizedMetaObject.name = normalizedMetaObject.name!.concat('...')
          }
          normalizedMetaObject.description = content
          normalizedMetaObject.noteId = dragElement.noteId
          const metaLink: PartialWithId<MetaLink> = {
            sourceId: noteMeta.id,
            targetId: normalizedMetaObject.id,
            id: Id.getId()
          }
          normalizedLinks.push(metaLink)
        }

        break
      }
      case 'metaElement': {
        const metaObject = await getMetaObjectById(dragElement.metaId)
        metaObject && Object.assign(normalizedMetaObject, metaObject)
        // we already have the meta object, so we don't need to create a new one
        shouldOpenEditMetaModal = false
        alreadyHasMeta = true
        break
      }
      case 'whiteboard': {
        const whiteboardMeta =
          (await getMetaObjectByObjectId(dragElement.whiteboardId)) ||
          (await addMetaObject({ type: 'whiteboard', objectId: dragElement.whiteboardId }, true))
        Object.assign(normalizedMetaObject, whiteboardMeta)
        alreadyHasMeta = true
        shouldOpenEditMetaModal = false
        break
      }
    }
    return {
      normalizedMetaObject,
      shouldOpenEditMetaModal,
      alreadyHasMeta,
      preLinks: normalizedLinks
    }
  }
  const renderMetaForm = () => {
    return (
      <ObjectForm
        onBack={() => {
          toggleEditMetaVisible(false)
          const promise = promiseRef.current
          pendingLinks?.forEach(l => {
            l.id && deleteMetaLink(l.id, true, true)
          })
          console.log(metaObject)
          metaObject?.id && deleteMetaObject(metaObject?.id, true, true)
          if (promise) {
            promise.rej?.(null)
          }
          promiseRef.current = undefined
        }}
        shouldPreviewGraph={pendingLinks.length > 0}
        initialObject={metaObject}
        onSubmit={async obj => {
          // give a new id to prevent hooks order change of get meta target obj
          if (metaObject) {
            const newMetaObj = Object.assign(metaObject, obj)
            updateMetaObject(newMetaObj, true)
            console.log(newMetaObj)
            const setting = getSetting()
            if (setting.notification.enabled && setting.notification.object) {
              toast.success('Successfully add object!')
            }
            const promise = promiseRef.current
            if (promise) {
              promise.res?.(newMetaObj)
            }
          }
          toggleEditMetaVisible(false)
          promiseRef.current = undefined
        }}
      />
    )
  }
  useEffect(() => {
    emitter.addListener('global', dropHandler)
    return () => {
      emitter.removeListener('global', dropHandler)
    }
  }, [])
  useEffect(() => {
    if (!editMetaVisible) {
      setPendingLinks([])
    }
  }, [editMetaVisible])
  const portal = createPortal(
    <>
      <Modal noStyle visible={editMetaVisible} onClose={toggleEditMetaVisible}>
        {renderMetaForm()}
      </Modal>
    </>,
    document.body,
    'overlay-meta-portal'
  )
  return {
    portal
  }
}

export default useOverlayDrop
