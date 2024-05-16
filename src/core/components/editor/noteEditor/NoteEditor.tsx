import { AIStore, MetaStore, ObjectStore } from '@/api/stores'
import { Editor } from '@/core/components/editor/Editor'
import { useMemo, useRef, useState } from 'react'
import Id from '@/utils/id'
import useSyncValue from '@/core/components/editor/noteEditor/useSyncValue'
import { EditorProps, IEditorInstance } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import useStoreValue from '@/core/components/editor/noteEditor/useStoreValue'
import useDrop from '@/core/components/editor/noteEditor/useDrop'
import useAddNewElement from '@/core/components/editor/noteEditor/useAddNewElement'
import useLabel from '@/core/components/editor/noteEditor/useLabel'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import useCheckInsideMeta from '@/core/components/editor/noteEditor/useCheckInsideMeta'
import { AI_QUESTION_PROP_ID, AI_SUMMARY_PROP_ID } from '@/api/stores/meta/meta.store'

/**
 *  基于笔记的编辑器
 *  支持多编辑器数据同步，保存到本地等
 */
// initial height: 在内容没加载出来时的placeholder高度
const NoteEditor = ({
  noteId,
  labelIds,
  initialHeight,
  on,
  metaId,
  ...rest
}: { noteId?: number; metaId?: number; initialHeight?: number } & Omit<EditorProps, 'id'>) => {
  const note = ObjectStore('note').useValue(noteId)
  const noteMeta = MetaStore.useValue(metaId)
  const editorId = useMemo(() => Id.getStrId(), [])
  const instanceRef = useRef<IEditorInstance>()
  const handleDrop = useDrop(noteId, metaId)
  const handleAddNewElementFromMenu = useAddNewElement(metaId)
  useSyncValue(editorId, noteId, instanceRef)
  const { saveValueToNote, fetchedValue } = useStoreValue({
    noteId,
    instanceRef,
    metaId,
    onContentLoaded: () => {
      if (instanceRef.current) {
        rest.onInstanceInitialized?.(instanceRef.current)
      }
    },
    defaultValue: rest.defaultValue
  })
  const { handleDeleteLable, handleAddLabel } = useLabel(note)
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  useCheckInsideMeta(instanceRef, metaId, noteId)

  return (
    <Editor
      {...rest}
      styles={{
        ...rest.styles,
        containerHeight:
          initialHeight !== undefined ? (!fetchedValue ? initialHeight : rest.styles?.containerHeight) : rest.styles?.containerHeight
      }}
      state={{
        lastSavedAt: note?.lastSavedAt,
        saveImgLocally: true,
        labelSortMode: note?.labelSortMode,
        labelPriority: note?.labelPriority,
        labelScrollOffset: note?.labelScrollOffset,
        ...rest.state
      }}
      defaultValue={fetchedValue || rest.defaultValue}
      labelIds={labelIds || note?.labels}
      id={rest.id || editorId}
      stringTitle={noteMeta?.name || rest.stringTitle || 'Untitled'}
      onInstanceInitialized={i => {
        instanceRef.current = i
        if (fetchedValue) {
          i.replaceChildren?.(fetchedValue)
          rest.onInstanceInitialized?.(i)
        }
        if (!noteId) {
          rest.onInstanceInitialized?.(i)
        }
      }}
      ai={
        rest.ai || {
          summary: noteMeta?.properties?.[AI_SUMMARY_PROP_ID]?.value,
          questions: noteMeta?.properties?.[AI_QUESTION_PROP_ID]?.value
        }
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
              noteId,
              fromMetaId: noteMeta?.id
            }
          }
          case 'save': {
            saveValueToNote(e.value)
            return
          }
          case 'copyLink': {
            if (noteMeta) {
              const links = e.blocks.map(i => `rendevoz://object/${noteMeta.id}?blockId=${i.id}`).join('\n')
              const html = e.blocks.map(i => `<p><a href="rendevoz://object/${noteMeta.id}?blockid=${i.id}">${i.text}</a></p>`).join('')
              const content = [
                new ClipboardItem({
                  'text/html': new Blob([html], { type: 'text/html' }),
                  'text/plain': new Blob([links], { type: 'text/plain' })
                })
              ]
              navigator.clipboard.write(content)
            }
            return
          }
          case 'linkToMeta': {
            if (metaId) {
              return await MetaStore.addMetaLink(
                {
                  sourceId: metaId,
                  targetId: e.targetMetaId
                },
                true
              )
            }
            break
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
          case 'AI summarize': {
            if (noteMeta) {
              const objId = noteMeta.objectId
              const questions = await Promise.all(
                e.questions.map(async i => await ObjectStore('question').addOne({ ...i, parentObjectId: objId }))
              )
              AIStore.updateMetaAI(noteMeta.id, {
                summary: e.summary,
                questions: questions
              })
            }
            return
          }
          case 'linkAddAsValue': {
            ObjectStore('webpage').addOneWithMeta(
              { url: e.url },
              {
                currentMeta: {
                  fromObject: noteMeta
                    ? {
                        type: 'note',
                        metaId: noteMeta.id
                      }
                    : undefined
                },
                showMetaModal: true
              }
            )
            return
          }
          case 'search': {
            GlobalSearchInstance.open?.({
              query: e.searchedText,
              from: {
                type: 'note',
                metaId: noteMeta?.id
              }
            })
            return
          }
          case 'updateNote': {
            if (noteId) {
              ObjectStore('note')
                .getOneById(noteId)
                .then(n => {
                  if (n) {
                    ObjectStore('note').updateOne(e.updater(n))
                  }
                })
            }
            break
          }
          case 'labelDrag': {
            Rendevoz.Actions.State.Drag.setDraggingDetails({
              type: 'noteLabel',
              labelId: e.labelId
            })
            return
          }
          case 'titleChange': {
            if (noteMeta) {
              const newTitle = e.value
              MetaStore.updateMetaObject({ id: noteMeta.id, name: newTitle })
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
