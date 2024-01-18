import { GlobalInstance, useToggle } from '@/hooks'
import { MetaStore, ObjectStore } from '@/api/stores'
import { PartialWithId } from '@/types'
import Id from '@/utils/id'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FormType, Modal } from '@/components'
import { getSetting } from '@/core'
import { DropOn, MetaLink, MetaObject } from '~/typings'
import { useEventHandler } from '@/events'
import useDropObject, { clearDragState } from './useDropObject'
import { Rendevoz } from '@/core/rendevoz'
import { TypeToRegisteredObject } from '@/api/stores/object/object.store'
import { KeyToRegisteredDropOnProcessor } from '@/core/plugin/RegisterMap'
import { assignProperties } from '@/utils'
import normalizeDraggableIntoMeta from '@/core/global/globalDragOverlay/normalizeDraggableIntoMeta'

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
  assignProperties(GlobalInstance, {
    metaOps: {
      ...GlobalInstance.metaOps,
      addDraggableAsMeta: async (d, hidden) => {
        const currentKeys = new Set(MetaStore.getMetaObjectsMap().keys())
        const res = (await emitter.emitWithCallback('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            draggingElement: d
          }
        })) as MetaObject
        const isNewlyCreated = !currentKeys.has(res.id)
        if (res.hidden && hidden !== true) {
          await MetaStore.updateMetaObject({ id: res.id, hidden: false })
        }
        if (hidden && isNewlyCreated) {
          await MetaStore.updateMetaObject?.({ id: res.id, hidden: true })
        }
        return res
      }
    }
  })
  // two situations, 1. drop metaobject / object 2. drop event
  dropEventHandler.on('globalDropNeedFurtherProcess', async (data, res, rej) => {
    const { dropOn } = data
    let normalizedMetaObject: MetaObject | undefined = undefined,
      shouldOpenEditMetaModal = false,
      alreadyHasMeta = false,
      preLinks: Partial<MetaLink>[] = []
    let customNormalize = normalizeDraggableIntoMeta
    const customGetDropOnLinks = getDropOnPostLinks

    if (data.draggingElement) {
      if (data.draggingElement.type === 'collection') {
        return Promise.reject()
      }

      const type = data.draggingElement.type
      if (TypeToRegisteredObject.has(type)) {
        const { normalizeDraggingEleToMetaObject: _customNormalize } = TypeToRegisteredObject.get(type)!
        if (!_customNormalize) {
          console.error('No normalize function registered! Please register normalizeDraggingEleToMetaObject!')
          return
        }
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
    if (data.e && data.e instanceof DragEvent) {
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
    if (!normalizedMetaObject || !normalizedMetaObject.type) return
    if (dropOn && normalizedMetaObject) {
      postLink = [...((await customGetDropOnLinks(dropOn, normalizedMetaObject)) || [])]
    }
    let allPendingLinks = [...preLinks, ...postLink].filter(i => i !== undefined && i.sourceId && i.targetId) as PartialWithId<MetaLink>[]
    const settings = getSetting()
    const enableLink = settings.objectAndLink.enableAll
    if (!enableLink) {
      allPendingLinks = []
    }
    if (shouldOpenEditMetaModal === false || alreadyHasMeta) {
      res?.(normalizedMetaObject)
      allPendingLinks.forEach(i => addMetaLink(i))
      return
    }

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
    addMetaObject(normalizedMetaObject).then(m => {
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
    console.log(dropOn)
    switch (dropOn.dropOn) {
      case 'database': {
        break
      }
      case 'editor': {
        if (!dropOn.noteId) break
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
          (await addMetaObject({ id: Id.getId(), objectId: dropOn.noteId, type: 'note' }))

        link.targetId = noteMeta.id
        break
      }
      case 'pdf': {
        if (!enableDropOnPDFLink) break
        const pdfMeta =
          (await getMetaObjectByObjectId(dropOn.pdfId)) ||
          (await addMetaObject({ id: Id.getId(), objectId: dropOn.pdfId, type: 'pdf' }))
        link.targetId = pdfMeta.id
        break
      }
      case 'whiteboard': {
        if (!enableDropOnWhiteboardLink) break
        const whiteboardMeta =
          (await getMetaObjectByObjectId(dropOn.whiteboardId)) ||
          (await addMetaObject(
            {
              id: Id.getId(),
              objectId: dropOn.whiteboardId,
              type: 'whiteboard'
            }
          ))
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

  const renderMetaForm = () => {
    return (
      <FormType.Object
        onBack={() => {
          toggleEditMetaVisible(false)
          const promise = promiseRef.current
          pendingLinks?.forEach(l => {
            l.id && deleteMetaLink(l.id, true, true)
          })

          metaObject?.id && deleteMetaObject(metaObject?.id, {
            silent: true,
            force: true
          })
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
