import { useToggle } from '@/hooks'
import { indexedMetaLinksAtom, TypeToRegisteredMetaObject } from '@/stores/meta.store'
import { globalStore, MetaStore, ObjectStore } from '@/stores'
import { PartialWithId } from '@/types'
import Id from '@/utils/id'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Node } from 'slate'
import { FormType, Modal } from '@/components'
import { getSetting, intersectionOfMultipleSets } from '@/core'
import { DropOn, GlobalDraggingDetails, MetaLink, MetaObject } from '~/typings'
import { useEventHandler } from '@/events'
import useDropObject, { clearDragState } from './useDropObject'
import { transformTextContentToNameAndDescription, createLink, addLinkBetweenTwoMetaObject } from './utils'
import { Rendevoz } from '@/core/rendevoz'
import { TypeToRegisteredObject } from '@/stores/object.store'
import { KeyToRegisteredDropOnProcessor } from '@/core/plugin/RegisterMap'

const useOverlayDrop = () => {
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const dropEventHandler = useEventHandler('global')
  const { addMetaLink, addMetaObject, getMetaObjectById, getMetaObjectByObjectId, deleteMetaLink, deleteMetaObject, updateMetaObject } =
    MetaStore
  const [metaObject, setMetaObject] = useState<MetaObject & { noteId?: number }>()
  const [pendingLinks, setPendingLinks] = useState<Partial<MetaLink>[]>([])
  const [editMetaVisible, toggleEditMetaVisible] = useToggle(false)
  const promiseRef = useRef<{
    res: ((value: unknown) => void) | undefined
    rej: ((value: unknown) => void) | undefined
  }>()

  const { normalizeDropToMeta } = useDropObject()
  // two situations, 1. drop metaobject / object 2. drop event
  dropEventHandler.on('globalDropNeedFurtherProcess', async (data, res, rej) => {
    const { dropOn } = data
    let normalizedMetaObject: MetaObject | undefined = undefined,
      shouldOpenEditMetaModal = false,
      alreadyHasMeta = false,
      preLinks: Partial<MetaLink>[] = []
    let customNormalize = normalizeDraggingEleToMetaObject
    const customGetDropOnLinks = getDropOnPostLinks

    if (data.draggingElement) {
      console.log(data.draggingElement)
      const type = data.draggingElement.type
      if (TypeToRegisteredObject.has(type)) {
        const { normalizeDraggingEleToMetaObject: _customNormalize } = TypeToRegisteredObject.get(type)!
        console.log(normalizeDraggingEleToMetaObject)
        if (_customNormalize) {
          customNormalize = _customNormalize
        }
      }

      const {
        normalizedMetaObject: n,
        shouldOpenEditMetaModal: s,
        alreadyHasMeta: a,
        preLinks: p
      } = await customNormalize(data.draggingElement)
      normalizedMetaObject = n
      shouldOpenEditMetaModal = s
      alreadyHasMeta = a
      preLinks = p
    }

    // drop event
    if (data.e) {
      const n = await normalizeDropToMeta(data.e)
      clearDragState()
      normalizedMetaObject = n
        ? ({
            ...n,
            name: n.name?.trim().replace(/\s\s+/g, ' ') || 'Unnamed Object',
            id: Id.getId()
          } as MetaObject)
        : undefined
      shouldOpenEditMetaModal = true
      alreadyHasMeta = false
      preLinks = []
    }
    let postLink: PartialWithId<MetaLink>[] = []
    if (!normalizedMetaObject) return
    if (dropOn && normalizedMetaObject) {
      postLink = [...((await customGetDropOnLinks(dropOn, normalizedMetaObject)) || [])]
    }
    const allPendingLinks = [...preLinks, ...postLink].filter(i => i !== undefined && i.sourceId && i.targetId) as PartialWithId<MetaLink>[]

    if (shouldOpenEditMetaModal === false || alreadyHasMeta) {
      res?.(normalizedMetaObject)
      allPendingLinks.forEach(i => addMetaLink(i))
      return
    }

    const settings = getSetting()
    if (settings.objectAndLink.enableDropAutoGenerateObject) {
      allPendingLinks.forEach(i => addMetaLink(i, true))
      addMetaObject(normalizedMetaObject).then(m => {
        res?.(m)
      })
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
  })

  const getDropOnPostLinks = async (dropOn: DropOn, metaObject: MetaObject) => {
    const link: PartialWithId<MetaLink> = {
      id: Id.getId(),
      sourceId: metaObject.id
    }
    const { enableAll, enableDropOnEditorLink, enableDropOnPDFLink, enableDropOnWhiteboardLink } = getSetting().objectAndLink
    if (!enableAll) return
    const registeredDropOnProcessor = Array.from(KeyToRegisteredDropOnProcessor.values())
    const processedLinks = (
      (await Promise.all(registeredDropOnProcessor.map(processor => processor(dropOn, metaObject)))).filter(i =>
        Array.isArray(i)
      ) as MetaLink[][]
    ).flatMap(i => i)
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
      case 'attachment': {
        const targetMeta = await MetaStore.getMetaObjectById(dropOn.parentMetaId)
        if (targetMeta) {
          link.targetId = targetMeta.id
        }
      }
    }
    const allLinks: MetaLink[] = [...processedLinks]
    if (link.sourceId && link.targetId) {
      allLinks.push(link)
    }
    return allLinks
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
        const labelObject = await ObjectStore('pdfLabel').getOneById(dragElement.labelId)
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
          normalizedMetaObject.fromObject = {
            type: 'pdf',
            metaId: pdfMeta.id,
            selectedText: dragElement.content,
            pages: dragElement.page ? [dragElement.page] : undefined
          }
          const { name, description } = transformTextContentToNameAndDescription(dragElement.content)
          normalizedMetaObject.name = labelObject?.name || name || 'Unnamed PDF Label'
          normalizedMetaObject.description = labelObject?.description || description
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
          console.log(dragElement.element, content)
          const { name, description } = transformTextContentToNameAndDescription(content)
          normalizedMetaObject.name = name || 'Unnamed object'
          normalizedMetaObject.description = description
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
      case 'noteLabel': {
        const noteMeta = await retrieveMetaObjectByObjectId(dragElement.noteId, 'note')
        const noteLabelMeta = await getMetaObjectByObjectId(dragElement.highlightId)
        if (noteLabelMeta) {
          Object.assign(normalizedMetaObject, noteLabelMeta)
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          addLinkBetweenTwoMetaObject(noteMeta, noteLabelMeta)
        } else {
          const existedLabel = await ObjectStore('noteLabel').getOneById(dragElement.highlightId)
          const { name, description } = transformTextContentToNameAndDescription(dragElement.textContent)
          normalizedMetaObject.type = 'noteLabel'
          normalizedMetaObject.objectId = dragElement.highlightId
          normalizedMetaObject.name = existedLabel?.name || name || 'Note Label'
          normalizedMetaObject.description = existedLabel?.name || description
          normalizedMetaObject.fromObject = {
            metaId: noteMeta.id,
            type: 'note',
            selectedText: dragElement.textContent
          }
          normalizedLinks.push(createLink(noteMeta.id, normalizedMetaObject.id))
        }
        break
      }
      case 'webpageLabel': {
        const webpageMeta = await retrieveMetaObjectByObjectId(dragElement.webpageId, 'webpage')
        const webpageLabelMeta = await getMetaObjectByObjectId(dragElement.highlightId)
        if (webpageLabelMeta) {
          Object.assign(normalizedMetaObject, webpageLabelMeta)
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          addLinkBetweenTwoMetaObject(webpageMeta, webpageLabelMeta)
        } else {
          const existedLabel = await ObjectStore('webpageLabel').getOneById(dragElement.highlightId)
          const { name, description } = transformTextContentToNameAndDescription(dragElement.textContent)
          normalizedMetaObject.type = 'webpageLabel'
          normalizedMetaObject.objectId = dragElement.highlightId
          normalizedMetaObject.name = existedLabel?.name || name || 'Webpage Label'
          normalizedMetaObject.description = existedLabel?.description || description
          normalizedMetaObject.fromObject = {
            type: 'webpage',
            metaId: webpageMeta.id,
            selectedText: dragElement.textContent
          }
          normalizedLinks.push(createLink(webpageMeta.id, normalizedMetaObject.id))
        }
        break
      }
      case 'videoLabel': {
        const videoLabelObject = dragElement.id ? await ObjectStore('videoLabel').getOneById(dragElement.id) : undefined
        const videoMeta = videoLabelObject?.parentObjectId && (await retrieveMetaObjectByObjectId(videoLabelObject.parentObjectId, 'video'))
        const videoLabelMeta = dragElement.id && (await getMetaObjectByObjectId(dragElement.id))

        if (videoLabelMeta) {
          Object.assign(normalizedMetaObject, videoLabelMeta)
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
          if (videoMeta) {
            addLinkBetweenTwoMetaObject(videoMeta, videoLabelMeta)
          }
        } else {
          normalizedMetaObject.type = 'videoLabel'
          normalizedMetaObject.objectId = dragElement.id
          normalizedMetaObject.name = videoLabelObject?.name || 'Video Label'
          normalizedMetaObject.description = videoLabelObject?.description
          normalizedMetaObject.coverImgSrc = videoLabelObject?.imageUrl
          normalizedMetaObject.fromObject = videoMeta
            ? {
                type: 'video',
                metaId: videoMeta.id,
                time: dragElement.videoTime
              }
            : undefined

          if (videoMeta) {
            normalizedLinks.push(createLink(videoMeta.id, normalizedMetaObject.id))
          }
        }
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

  const retrieveMetaObjectByObjectId = async (objectId: number, type: MetaObject['type']) => {
    return (await getMetaObjectByObjectId(objectId)) || (await addMetaObject({ type, objectId }, true))
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
            updateMetaObject(newMetaObj)

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
    emitter.addListener('global', dropEventHandler)
    return () => {
      emitter.removeListener('global', dropEventHandler)
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
