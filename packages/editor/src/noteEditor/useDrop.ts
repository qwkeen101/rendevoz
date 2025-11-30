import { IEditorEvent, MetaObject } from '~/typings'
import Id from './utils/id'
import fileSystem from '@/api/fileSystem'
import handleInsertMetasIntoEditor from '../hooks/handleInsertMetasIntoEditor'

const useDrop = (_noteId?: number, metaId?: number) => {
  const noteMeta = undefined
  const handleProcessMetas = (metas: MetaObject[]) => handleInsertMetasIntoEditor(metas, noteMeta)
  const handlePointerDropToNoteEditor = async () => {
    const metas = await Global.metaOps.addDraggableAsMeta(undefined, {
      dropOn: noteMeta
        ? {
            type: 'meta',
            metaId: noteMeta.id
          }
        : undefined
    })
    return handleProcessMetas(metas)
  }
  const handleDropDropToNoteEditor = async (event: DragEvent) => {
    event.preventDefault()
    const normalized = await Global.utils.normalizeDragEvent(event)
    if (normalized?.type === 'images') {
      return normalized.imgs.map(i => ({
        type: 'image',
        id: Id.getId(),
        url: i.path,
        children: [{ text: '' }]
      }))
    }
    if (normalized?.type === 'files') {
      const imgs = normalized.files.filter(f => f.type.startsWith('image'))
      if (imgs.length) {
        return await Promise.all(
          imgs.map(async i => ({
            type: 'image',
            id: Id.getId(),
            url: await fileSystem.saveImage(i, { compress: false }),
            children: [{ text: '' }]
          }))
        )
      }
    }
    const result = await Global.metaOps.addDraggableAsMeta(undefined, {
      dropOn: noteMeta
        ? {
            metaId: noteMeta.id,
            type: 'meta'
          }
        : undefined,
      event
    })
    return handleProcessMetas(result)
  }
  const handleDrop = async (e: IEditorEvent & { type: 'drop' }) => {
    if (!e.event) return
    if (e.event instanceof PointerEvent) {
      return await handlePointerDropToNoteEditor()
    }
    if (e.event instanceof DragEvent) {
      return await handleDropDropToNoteEditor(e.event)
    }
  }
  return handleDrop
}

export default useDrop
