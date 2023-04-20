import { DropOn, GlobalEventHandler } from '@/events/globalEvent'
import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useToggle } from '@/hooks'
import { indexedMetaLinksAtom } from '@/stores/meta.store'
import { globalStore, MetaStore, ObjectStore } from '@/stores'
import { PartialWithId } from '@/types'
import Id from '@/utils/id'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-hot-toast'
import { Node } from 'slate'
import { FormType, Modal } from '@/components'
import { getSetting, intersectionOfMultipleSets } from '@/core'
import { GlobalDraggingDetails, MetaLink, MetaObject } from '~/typings'

const useOverlayDrop = () => {
  const emitter = useGlobalEventEmitter()
  const dropHandler = useMemo(() => new GlobalEventHandler(), [])
  const { addMetaLink, addMetaObject, getMetaObjectById, getMetaObjectByObjectId, deleteMetaLink, deleteMetaObject, updateMetaObject } =
    MetaStore
  const [metaObject, setMetaObject] = useState<MetaObject & { noteId?: number }>()
  const [pendingLinks, setPendingLinks] = useState<Partial<MetaLink>[]>([])
  const [editMetaVisible, toggleEditMetaVisible] = useToggle(false)
  const promiseRef = useRef<{
    res: ((value: unknown) => void) | undefined
    rej: ((value: unknown) => void) | undefined
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
      addMetaObject(normalizedMetaObject, true).then(m => {
        setMetaObject(m)
        toggleEditMetaVisible(true)
      })
    }
  })
  const getDropOnPostLinks = async (dropOn: DropOn, metaObject: MetaObject) => {
    const link: PartialWithId<MetaLink> = {
      id: Id.getId(),
      sourceId: metaObject.id
    }
    const { enableAll, enableDropOnEditorLink, enableDropOnPDFLink, enableDropOnWhiteboardLink } = getSetting().objectAndLink
    if (!enableAll) return
    switch (dropOn.dropOn) {
      case 'database': {
        break
      }
      case 'editor': {
        if (!enableDropOnEditorLink) break
        const note = await ObjectStore('note').getOneById(dropOn.noteId)
        if (note?.metaId) {
          const noteTargetMeta = await getMetaObjectById(note.metaId)
          if (noteTargetMeta) {
            link.targetId = noteTargetMeta?.id
          }
          break
        }
        const noteMeta =
          (await getMetaObjectByObjectId(dropOn.noteId)) ||
          (await addMetaObject({ id: Id.getId(), objectId: dropOn.noteId, type: 'note' }, true))

        link.targetId = noteMeta.id
        break
      }
      case 'pdf': {
        if (!enableDropOnPDFLink) break
        const pdfMeta =
          (await getMetaObjectByObjectId(dropOn.pdfId)) ||
          (await addMetaObject({ id: Id.getId(), objectId: dropOn.pdfId, type: 'pdf' }, true))
        link.targetId = pdfMeta.id
        break
      }
      case 'whiteboard': {
        if (!enableDropOnWhiteboardLink) break
        const whiteboardMeta =
          (await getMetaObjectByObjectId(dropOn.whiteboardId)) ||
          (await addMetaObject({ id: Id.getId(), objectId: dropOn.whiteboardId, type: 'whiteboard' }, true))
        link.targetId = whiteboardMeta.id
        break
      }
    }
    if (link.sourceId && link.targetId) {
      return link
    }
  }
  const normalizeDraggingEleToMetaObject = async (
    dragElement: GlobalDraggingDetails
  ): Promise<{
    normalizedMetaObject: MetaObject
    alreadyHasMeta: boolean
    shouldOpenEditMetaModal: boolean
    preLinks: PartialWithId<MetaLink>[]
  }> => {
    const { enableDragFromEditorLink, enableDragFromPDFLink, enableAll } = getSetting().objectAndLink
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
      case 'pdfLabel': {
        const labelMeta = getMetaObjectByObjectId(dragElement.labelId)
        const pdfMeta =
          (await getMetaObjectByObjectId(dragElement.pdfId)) || (await addMetaObject({ type: 'pdf', objectId: dragElement.pdfId }, true))
        if (labelMeta) {
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          if (enableDragFromPDFLink && enableAll) {
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
          }
          Object.assign(normalizedMetaObject, labelMeta)
        } else {
          normalizedMetaObject.type = 'pdfLabel'
          normalizedMetaObject.objectId = dragElement.labelId
          normalizedMetaObject.name = dragElement.content?.slice(0, 50) || 'Unnamed Label'
          normalizedMetaObject.from = {
            metaId: pdfMeta.id
          }
          const shouldConcat = dragElement.content && dragElement.content?.length > 50
          if (shouldConcat) {
            normalizedMetaObject.name = normalizedMetaObject.name.concat('...')
          }
          normalizedMetaObject.description = dragElement.content
          if (enableDragFromPDFLink && enableAll) {
            const metaLink: PartialWithId<MetaLink> = {
              sourceId: pdfMeta.id,
              targetId: normalizedMetaObject.id,
              id: Id.getId()
            }
            normalizedLinks.push(metaLink)
          }
        }

        break
      }
      case 'noteBlock': {
        if (dragElement.metaId) {
          const meta = await getMetaObjectById(dragElement.metaId)
          if (meta) {
            Object.assign(normalizedMetaObject, meta)
            shouldOpenEditMetaModal = false
            alreadyHasMeta = true
            break
          }
        }
        const noteMeta = await retrieveMetaObjectByObjectId(dragElement.noteId, 'note')
        const noteBlockMeta = getMetaObjectByObjectId(dragElement.blockId)
        if (noteBlockMeta) {
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          if (enableDragFromEditorLink && enableAll) {
            addLinkBetweenTwoMetaObject(noteMeta, noteBlockMeta)
          }
          Object.assign(normalizedMetaObject, noteBlockMeta)
        } else {
          const block = await ObjectStore('noteBlock').addOne(
            {
              blockId: dragElement.blockId,
              noteId: dragElement.noteId,
              id: dragElement.blockId
            },
            { silent: true }
          )
          normalizedMetaObject.type = 'noteBlock'
          normalizedMetaObject.objectId = block.id
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
          if (enableDragFromEditorLink && enableAll) {
            const metaLink: PartialWithId<MetaLink> = {
              sourceId: noteMeta.id,
              targetId: normalizedMetaObject.id,
              id: Id.getId()
            }
            normalizedLinks.push(metaLink)
          }
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
      case 'note label': {
        const noteMeta = await retrieveMetaObjectByObjectId(dragElement.noteId, 'note')
        const noteLabelMeta = await getMetaObjectByObjectId(dragElement.highlightId)
        if (noteLabelMeta) {
          Object.assign(normalizedMetaObject, noteLabelMeta)
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          addLinkBetweenTwoMetaObject(noteMeta, noteLabelMeta)
        } else {
          const { name, description } = transformTextContentToNameAndDescription(dragElement.textContent)
          normalizedMetaObject.type = 'noteLabel'
          normalizedMetaObject.objectId = dragElement.highlightId
          normalizedMetaObject.name = name || 'Note Label'
          normalizedMetaObject.description = description
          normalizedMetaObject.from = {
            metaId: noteMeta.id
          }
          normalizedLinks.push(createLink(noteMeta.id, normalizedMetaObject.id))
        }
        break
      }
      case 'webpage label': {
        const webpageMeta = await retrieveMetaObjectByObjectId(dragElement.webpageId, 'webpage')
        const webpageLabelMeta = await getMetaObjectByObjectId(dragElement.highlightId)
        if (webpageLabelMeta) {
          Object.assign(normalizedMetaObject, webpageLabelMeta)
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          addLinkBetweenTwoMetaObject(webpageMeta, webpageLabelMeta)
        } else {
          const { name, description } = transformTextContentToNameAndDescription(dragElement.textContent)
          normalizedMetaObject.type = 'webpageLabel'
          normalizedMetaObject.objectId = dragElement.highlightId
          normalizedMetaObject.name = name || 'Webpage Label'
          normalizedMetaObject.description = description
          normalizedMetaObject.from = {
            icon: webpageMeta.from?.icon,
            name: webpageMeta.name
          }
          normalizedLinks.push(createLink(webpageMeta.id, normalizedMetaObject.id))
        }
      }
    }
    return {
      normalizedMetaObject,
      shouldOpenEditMetaModal,
      alreadyHasMeta,
      preLinks: normalizedLinks
    }
  }
  const transformTextContentToNameAndDescription = (
    textContent?: string
  ): {
    name: string | undefined
    description: string | undefined
  } => {
    if (textContent && textContent.length > 0) {
      return {
        name: textContent.slice(0, 50),
        description: textContent
      }
    }
    return {
      name: undefined,
      description: undefined
    }
  }
  const createLink = (sourceMetaId: number, targetMetaId: number): PartialWithId<MetaLink> => {
    return {
      sourceId: sourceMetaId,
      targetId: targetMetaId,
      id: Id.getId()
    }
  }
  const retrieveMetaObjectByObjectId = async (objectId: number, type: MetaObject['type']) => {
    return (await getMetaObjectByObjectId(objectId)) || (await addMetaObject({ type, objectId }, true))
  }
  const addLinkBetweenTwoMetaObject = (metaSource: MetaObject, metaTarget: MetaObject) => {
    const linkIndex = globalStore.get(indexedMetaLinksAtom)
    if (linkIndex) {
      const sourceToLinks = linkIndex.sourceIdToLinkIdsMap.get(metaSource.id)
      const targetToLinks = linkIndex.targetIdToLinkIdMap.get(metaTarget.id)
      if (sourceToLinks && targetToLinks) {
        const size = intersectionOfMultipleSets(sourceToLinks, targetToLinks).size
        if (size === 0) {
          addMetaLink({
            sourceId: metaSource.id,
            targetId: metaTarget.id
          })
        }
      }
    }
  }
  const renderMetaForm = () => {
    return (
      <FormType.Object
        onBack={() => {
          toggleEditMetaVisible(false)
          const promise = promiseRef.current
          pendingLinks?.forEach(l => {
            l.id && deleteMetaLink(l.id, true, true)
          })

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
            const newMetaObj = { ...metaObject, ...obj }
            updateMetaObject(newMetaObj, true)

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
