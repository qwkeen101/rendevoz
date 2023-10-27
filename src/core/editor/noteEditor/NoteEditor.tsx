import { MetaStore, ObjectStore } from '@/stores'
import { Editor } from '@/core/editor/Editor'
import { useMemo, useState } from 'react'
import Id from '@/utils/id'
import useSyncValue from '@/core/editor/noteEditor/useSyncValue'
import { EditorProps, IEditorInstance } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import useStoreValue from '@/core/editor/noteEditor/useStoreValue'
import useDrop from '@/core/editor/noteEditor/useDrop'
import useAddNewElement from '@/core/editor/noteEditor/useAddNewElement'
import useLabel from '@/core/editor/noteEditor/useLabel'
import { GlobalInstance } from '@/hooks'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'

/**
 *  基于笔记的编辑器
 *  支持多编辑器数据同步，保存到本地等
 */
const NoteEditor = ({ noteId, labelIds, on, ...rest }: { noteId?: number } & EditorProps) => {
  const note = ObjectStore('note').useValue(noteId)
  const noteMeta = MetaStore.useObjectToMetaValue(noteId || 0)
  if (noteMeta && note && !note?.metaId) {
    ObjectStore('note').updateOne({ id: note.id, metaId: noteMeta.id })
  }
  const editorId = useMemo(() => Id.getStrId(), [])
  const [instance, setInstance] = useState<IEditorInstance>()
  const handleDrop = useDrop(noteId)
  const handleAddNewElementFromMenu = useAddNewElement(noteId)
  useSyncValue(editorId, noteId, instance)
  const { saveValueToNote } = useStoreValue({
    editorId,
    noteId,
    instance,
    onContentLoaded: () => {
      if (instance) {
        rest.onInstanceInitialized?.(instance)
      }
    },
    defaultValue: rest.defaultValue
  })
  const { handleDeleteLable, handleAddLabel } = useLabel(note)
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const updater = ObjectStore('note').updateOne

  return (
    <Editor
      {...rest}
      labelIds={labelIds || note?.labels}
      id={rest.id || editorId}
      stringTitle={noteMeta?.name || rest.stringTitle || 'Untitled'}
      onInstanceInitialized={i => {
        setInstance(i)
        if (!noteId) {
          rest.onInstanceInitialized?.(i)
        }
      }}
      state={
        note
          ? {
              pageWidth: note?.pageWidth,
              fontSize: note?.fontSize,
              lastSavedAt: note?.lastSavedAt,
              typeface: note?.typeface,
              saveImgLocally: true,
              lineSpacing: note?.lineSpacing
            }
          : rest.state
      }
      on={async e => {
        if (on) {
          const res = await on?.(e)
          if (res) {
            return res
          }
        }
        switch (e.type) {
          case 'blockDragged': {
            return {
              noteId
            }
          }
          case 'save': {
            saveValueToNote(e.value)
            return
          }
          case 'deleteLabel': {
            return await handleDeleteLable(e.labelId)
          }
          case 'addLabel': {
            return await handleAddLabel(e.currentLabel)
          }
          case 'addNewElementFromMenu':
            return await handleAddNewElementFromMenu(e.newElementType)
          case 'drop': {
            return await handleDrop(e)
          }
          case 'search': {
            GlobalSearchInstance.open({
              query: e.searchedText,
              from: {
                type: 'note',
                metaId: noteMeta.id
              }
            })
            return
          }
          case 'stateChange': {
            switch (e.event.type) {
              case 'fontSize': {
                updater({ id: noteId, fontSize: e.event.fontSize })
                break
              }
              case 'containerWidth': {
                updater({ id: noteId, width: e.event.widthType })
                break
              }
              case 'typeface': {
                updater({ id: noteId, typeface: e.event.typeface })
                break
              }
              case 'lineSpacing': {
                updater({ id: noteId, lineSpacing: e.event.lineSpacing })
                break
              }
              case 'pageWidth': {
                updater({ id: noteId, pageWidth: e.event.width })
                break
              }
            }
            break
          }
          case 'titleChange': {
            console.log(e.value, noteMeta)
            if (noteMeta) {
              const newTitle = e.value
              MetaStore.updateMetaObject({ id: noteMeta.id, name: newTitle }, true)
            }
            return
          }
        }
      }}
      onOperationApplied={op => {
        if (noteId) {
          emitter.emit('editor', {
            type: 'operationApplied',
            data: {
              noteId,
              id: editorId,
              operation: op
            }
          })
        }
      }}
    />
  )
}

export default NoteEditor
