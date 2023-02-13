import { GlobalEventHandler } from '@/events/globalEvent'
import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn, useToggle } from '@/hooks'
import useMetaStore, { ObjectIdToMetaObjectMapAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores/stores'
import { PartialWithId } from '@/types'
import Id from '@/utils/id'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-hot-toast'
import { Node } from 'slate'
import { MetaLink, MetaObject } from '~/typings/data'
import Modal from '../base/Modal'
import EditMetaObjectForm from '../form/EditMetaObjectForm'
import { AvaliableGlobalDraggingElements, GlobalDragOverlayInstance } from './GlobalDragOverlay'

const useOverlayDrop = () => {
  const emitter = useEventEmitter()
  const dropHandler = useMemo(() => new GlobalEventHandler(), [])
  const { addMetaLink, addMetaObject, getMetaObjectById, getMetaObjectByObjectId, deleteMetaLink } = useMetaStore()
  const [metaObject, setMetaObject] = useState<MetaObject & { noteId?: number }>()
  const [pendingLinks, setPendingLinks] = useState<Partial<MetaLink>[]>([])
  const [editMetaVisible, toggleEditMetaVisible] = useToggle(false)
  const promiseRef = useRef<{
    res: any
    rej: any
  }>()
  dropHandler.on(
    'dragDrop',
    useMemoizedFn(async data => {
      const { dragElement, dropOn } = data
      if (!dragElement?.type) return
      GlobalDragOverlayInstance.draggingDetails = undefined
      const normalizedMetaObject: PartialWithId<MetaObject & { noteId: number }> = {
        id: Id.getId(),
        type: 'normal'
      }
      const links = pendingLinks
      let alreadyHasMeta = false
      let shouldOpenEditMetaModal = true
      // here we deal with the dragging element
      switch (dragElement?.type) {
        case 'image': {
          normalizedMetaObject.type = 'image'
          normalizedMetaObject.name = `Unnamed image ${Id.getId()}`
          normalizedMetaObject.coverImgSrc = dragElement.url
          break
        }
        case 'pdfElement': {
          const maybeExistedLabelMeta = getMetaObjectByObjectId(dragElement.labelId)
          if (maybeExistedLabelMeta) {
            alreadyHasMeta = true
            shouldOpenEditMetaModal = false
            normalizedMetaObject.id = maybeExistedLabelMeta.id
          }
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
            (await getMetaObjectByObjectId(dragElement.pdfId)) || (await addMetaObject({ type: 'pdf', objectId: dragElement.pdfId }))
          const metaLink: Partial<MetaLink> = {
            sourceId: pdfMeta.id,
            targetId: maybeExistedLabelMeta?.id || normalizedMetaObject.id
          }
          links.push(metaLink)
          break
        }
        case 'noteElement': {
          normalizedMetaObject.type = 'noteElement'
          normalizedMetaObject.objectId = dragElement.blockId
          const maybeExistedLabelMeta = getMetaObjectByObjectId(dragElement.blockId)
          if (maybeExistedLabelMeta) {
            alreadyHasMeta = true
            shouldOpenEditMetaModal = false
            normalizedMetaObject.id = maybeExistedLabelMeta.id
          }
          const content = dragElement.elements ? dragElement.elements.map(n => Node.string(n)).join(' ') : Node.string(dragElement.element)
          normalizedMetaObject.name = content?.slice(0, 50) || 'Unnamed object'
          const shouldConcat = dragElement.content?.length > 50
          if (shouldConcat) {
            normalizedMetaObject.name = normalizedMetaObject.name!.concat('...')
          }
          normalizedMetaObject.description = content
          normalizedMetaObject.noteId = dragElement.noteId
          const noteMeta =
            (await getMetaObjectByObjectId(dragElement.noteId)) || (await addMetaObject({ type: 'note', objectId: dragElement.noteId }))
          const metaLink: Partial<MetaLink> = {
            sourceId: noteMeta.id,
            targetId: normalizedMetaObject.id
          }
          links.push(metaLink)
          break
        }
        case 'metaElement': {
          normalizedMetaObject.id = dragElement.metaId
          // we already have the meta object, so we don't need to create a new one
          shouldOpenEditMetaModal = false
          alreadyHasMeta = true
        }
      }
      setMetaObject(normalizedMetaObject)
      // here we deal with the drop process
      switch (dropOn) {
        case 'database': {
          // no more link is needed
          setPendingLinks([...links])
          if (alreadyHasMeta) {
            toast.error('Object Already Exists!')
            break
          }
          break
        }
        case 'editor': {
          const { note } = data
          if (!note) break
          const { id: noteId } = note
          const noteMeta =
            (await getMetaObjectByObjectId(noteId)) ||
            (await addMetaObject({
              objectId: noteId,
              type: 'note',
              name: note.title
            }))
          if (!noteMeta) break
          const canNotAddIntoNoteTypes = ['collection']
          if (canNotAddIntoNoteTypes.includes(dragElement?.type)) {
            toast.error('Collection Can Not Be Added Into Note!')
            break
          }

          const metaLink: Partial<MetaLink> = {
            sourceId: normalizedMetaObject.id,
            targetId: noteMeta.id
          }
          links.push(metaLink)
          if (dragElement.type === 'noteElement' && dragElement.noteId === note.id) {
            shouldOpenEditMetaModal = false
            links.length = 0
          }
          setPendingLinks([...links])
          break
        }
        case 'pdf':
          return
      }
      if (shouldOpenEditMetaModal) {
        toggleEditMetaVisible(true)
      } else {
        links.forEach(i => {
          addMetaLink(i)
        })
        setPendingLinks([])
      }
    })
  )
  dropHandler.on('dropOnEditorFurtherProcess', async (data, res, rej) => {
    if (GlobalDragOverlayInstance.draggingDetails) {
      const normalizedMetaObject = await normalizeDraggingEleToMetaObject(GlobalDragOverlayInstance.draggingDetails)
      promiseRef.current = {
        res,
        rej
      }
      setMetaObject(normalizedMetaObject)
      pendingLinks.push({
        sourceId: normalizedMetaObject.id,
        targetId: globalStore.get(ObjectIdToMetaObjectMapAtom).get(data.noteId)?.id
      })
      toggleEditMetaVisible(true)
    }
  })

  const normalizeDraggingEleToMetaObject = async (dragElement: AvaliableGlobalDraggingElements): Promise<MetaObject> => {
    const normalizedMetaObject: PartialWithId<MetaObject & { noteId: number }> = {
      id: Id.getId(),
      type: 'normal'
    }
    let alreadyHasMeta = false
    let shouldOpenEditMetaModal = true
    const links = pendingLinks
    switch (dragElement?.type) {
      case 'image': {
        normalizedMetaObject.type = 'image'
        normalizedMetaObject.name = `Unnamed image ${Id.getId()}`
        normalizedMetaObject.coverImgSrc = dragElement.url
        break
      }
      case 'pdfElement': {
        const maybeExistedLabelMeta = getMetaObjectByObjectId(dragElement.labelId)
        if (maybeExistedLabelMeta) {
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          normalizedMetaObject.id = maybeExistedLabelMeta.id
        }
        normalizedMetaObject.type = 'pdfElement'
        normalizedMetaObject.objectId = dragElement.labelId
        normalizedMetaObject.name = dragElement.content.slice(0, 50) || 'Unnamed object'
        const shouldConcat = dragElement.content.length > 50
        if (shouldConcat) {
          normalizedMetaObject.name = normalizedMetaObject.name.concat('...')
        }
        normalizedMetaObject.description = dragElement.content
        const pdfMeta =
          (await getMetaObjectByObjectId(dragElement.pdfId)) || (await addMetaObject({ type: 'pdf', objectId: dragElement.pdfId }))
        const metaLink: Partial<MetaLink> = {
          sourceId: pdfMeta.id,
          targetId: maybeExistedLabelMeta?.id || normalizedMetaObject.id
        }
        links.push(metaLink)
        break
      }
      case 'noteElement': {
        normalizedMetaObject.type = 'noteElement'
        normalizedMetaObject.objectId = dragElement.blockId
        const maybeExistedLabelMeta = getMetaObjectByObjectId(dragElement.blockId)
        if (maybeExistedLabelMeta) {
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          normalizedMetaObject.id = maybeExistedLabelMeta.id
        }
        const content = dragElement.elements ? dragElement.elements.map(n => Node.string(n)).join(' ') : Node.string(dragElement.element)
        normalizedMetaObject.name = content?.slice(0, 50) || 'Unnamed object'
        const shouldConcat = dragElement.content.length > 50
        if (shouldConcat) {
          normalizedMetaObject.name = normalizedMetaObject.name!.concat('...')
        }
        normalizedMetaObject.description = content
        normalizedMetaObject.noteId = dragElement.noteId
        const noteMeta =
          (await getMetaObjectByObjectId(dragElement.noteId)) || (await addMetaObject({ type: 'note', objectId: dragElement.noteId }))
        const metaLink: Partial<MetaLink> = {
          sourceId: noteMeta.id,
          targetId: normalizedMetaObject.id
        }
        links.push(metaLink)
        break
      }
      case 'metaElement': {
        normalizedMetaObject.id = dragElement.metaId
        // we already have the meta object, so we don't need to create a new one
        shouldOpenEditMetaModal = false
        alreadyHasMeta = true
      }
    }
    return normalizedMetaObject
  }
  const renderMetaForm = () => {
    return (
      <EditMetaObjectForm
        isCreating
        onClose={() => {
          toggleEditMetaVisible(false)
          const promise = promiseRef.current
          pendingLinks?.forEach(l => {
            l.id && deleteMetaLink(l.id, true)
          })
          setPendingLinks([])
          if (promise) {
            promise.rej(null)
          }
          promiseRef.current = undefined
        }}
        links={pendingLinks}
        metaObject={metaObject}
        onUpdate={async obj => {
          // give a new id to prevent hooks order change of get meta target obj
          const newMetaObj = await addMetaObject({ ...obj, id: Id.getId() })
          pendingLinks.forEach(link => {
            if (link.sourceId === obj.id) {
              link.sourceId = newMetaObj.id
            }
            if (link.targetId === obj.id) {
              link.targetId = newMetaObj.id
            }
            addMetaLink(link)
          })
          setPendingLinks([])
          toggleEditMetaVisible(false)
          const promise = promiseRef.current
          if (promise) {
            promise.res(newMetaObj)
          }
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
