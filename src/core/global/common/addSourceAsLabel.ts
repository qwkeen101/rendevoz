import { IGeneralSource } from '~/typings'
import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import { BaseSelection, createEditor, Editor, Transforms } from 'slate'
import Id from '@/utils/id'

export default async (selectedText: string, content: string, source: IGeneralSource) => {
  if ('labelId' in source && source.labelId) {
    const labelMeta = MetaStore.getMetaObjectByObjectId(source.labelId)
    if (labelMeta) {
      MetaStore.updateMetaObject({ id: labelMeta.id, name: content })
      return labelMeta.id
    }
  }
  switch (source.type) {
    case 'audio':
    case 'video': {
      const object = await ObjectStore(source.type).fetchOneById(source.objectId)
      if (object) {
        const label = await ObjectStore(`${source.type}Label`).addOne({
          parentObjectId: object.id,
          name: content,
          selectedText: selectedText,
          time: source.time
        })
        const meta = await Global.metaOps.addDraggableAsMeta({
          type: 'label',
          labelId: label.id
        })
        await ObjectStore(source.type).updateOne({ id: object.id, labels: [...(object.labels || []), label.id] })
        return meta[0]?.id
      }
      break
    }
    case 'note': {
      const object = await ObjectStore('note').fetchOneById(source.objectId)
      if (object) {
        const highlightId = await addLabelForNote(object.id, source.selection)
        if (highlightId) {
          const label = await ObjectStore('noteLabel').addOne({
            id: highlightId,
            parentObjectId: object.id,
            name: content,
            selectedText: selectedText
          })
          const meta = await Global.metaOps.addDraggableAsMeta({
            type: 'label',
            labelId: label.id
          })
          await ObjectStore('note').updateOne({ id: object.id, labels: [...(object.labels || []), label.id] })
          return meta[0]?.id
        }
      }
      break
    }
    case 'pdf': {
      const object = await ObjectStore('pdf').fetchOneById(source.objectId)
      if (object && source.rects) {
        const label = await ObjectStore(`pdfLabel`).addOne({
          parentObjectId: object.id,
          name: content,
          selectedText: selectedText,
          rects: source.rects,
          page: source.page,
          type: 'highlight',
          color: '#f5d576'
        })
        const meta = await Global.metaOps.addDraggableAsMeta({
          type: 'label',
          labelId: label.id
        })
        await ObjectStore('pdf').updateOne({ id: object.id, labels: [...(object.labels || []), label.id] })
        return meta[0]?.id
      }
      if (object && source.cropLabel) {
        const label = await ObjectStore(`pdfLabel`).addOne({
          parentObjectId: object.id,
          name: content,
          selectedText: selectedText,
          ...source.cropLabel
        })
        const meta = await Global.metaOps.addDraggableAsMeta({
          type: 'label',
          labelId: label.id
        })
        await ObjectStore('pdf').updateOne({ id: object.id, labels: [...(object.labels || []), label.id] })
        return meta[0]?.id
      }
      break
    }
    case 'webpage': {
      const object = await ObjectStore('webpage').getOneById(source.objectId)
      if (object && object.noteId) {
        const highlightId = await addLabelForNote(object.noteId, source.selection)
        if (highlightId) {
          const label = await ObjectStore('webpageLabel').addOne({
            id: highlightId,
            parentObjectId: object.id,
            name: content,
            selectedText: selectedText
          })
          const meta = await Global.metaOps.addDraggableAsMeta({
            type: 'label',
            labelId: label.id
          })
          await ObjectStore('webpage').updateOne({ id: object.id, labels: [...(object.labels || []), label.id] })
          return meta[0]?.id
        }
      }
      break
    }
  }
}

const addLabelForNote = async (noteId: number, selection: BaseSelection) => {
  if (!noteId || !selection) return
  const value = await NoteStore.getNoteIdValue(noteId)
  if (value) {
    const editor = createEditor()
    editor.children = value
    const id = Id.getId()
    Transforms.select(editor, selection)
    Editor.addMark(editor, 'highlight', id)
    editor.operations.forEach(i => {
      Global.emitEvent('editorOperationApplied', {
        noteId,
        operation: i
      })
    })
    setTimeout(() => {
      NoteStore.updateNoteValue(editor.children, noteId)
    })
    return id
  }
}
