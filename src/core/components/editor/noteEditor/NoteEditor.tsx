import { MetaStore, ObjectStore } from '@/api/stores'
import { Editor } from '@/core/components/editor/Editor'
import { useMemo, useRef, useState } from 'react'
import Id from '@/utils/id'
import useSyncValue from '@/core/components/editor/noteEditor/useSyncValue'
import { EditorProps, IEditorInstance, IGeneralSource } from '~/typings'
import useStoreValue from '@/core/components/editor/noteEditor/useStoreValue'
import useDrop from '@/core/components/editor/noteEditor/useDrop'
import useLabel from '@/core/components/editor/noteEditor/useLabel'
import useCheckInsideMeta from '@/core/components/editor/noteEditor/useCheckInsideMeta'
import { AI_SUMMARY_PROP_ID } from '@/api/stores/meta/meta.store'

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
  const [loaded, setLoaded] = useState(rest.defaultValue ? true : false)
  useSyncValue(editorId, noteId, instanceRef)
  const { fetchedValue } = useStoreValue({
    noteId,
    instanceRef,
    metaId,
    id: editorId,
    onContentLoaded: () => {
      setLoaded(true)
      if (instanceRef.current) {
        rest.onInstanceInitialized?.(instanceRef.current)
      }
    },
    defaultValue: rest.defaultValue
  })
  const { deleteLabel, addLabel } = useLabel(note)
  useCheckInsideMeta(instanceRef, metaId, noteId)
  const attachMeta = () => {
    const i = instanceRef.current
    if (i) {
      if (noteMeta) {
        i.values.metaId = noteMeta.id
      }
    }
  }
  attachMeta()
  if (noteId && !note) return null
  return (
    <Editor
      {...rest}
      metaId={metaId}
      styles={{
        ...rest.styles,
        containerHeight:
          initialHeight !== undefined ? (!loaded ? initialHeight : rest.styles?.containerHeight) : rest.styles?.containerHeight
      }}
      aiSummary={rest.aiSummary ?? note?.aiSummary}
      state={{
        lastSavedAt: note?.lastSavedAt,
        saveImgLocally: true,
        labelSortMode: note?.labelSortMode,
        labelPriority: note?.labelPriority,
        labelScrollOffset: note?.labelScrollOffset,
        labelFilter: note?.labelFilter,
        labelFolders: note?.labelFolders,
        defaultActiveSidebar: note?.defaultActiveSidebar,
        defaultSidebarVisible: note?.defaultSidebarVisible,
        defaultSidebarWidth: note?.defaultSidebarWidth,
        aiChat: rest.state?.aiChat ?? note?.aiChat,
        exam: rest.state?.exam ?? note?.exam,
        loaded: rest.defaultValue ? true : loaded,
        ...rest.state
      }}
      defaultValue={fetchedValue || rest.defaultValue}
      labelIds={labelIds || note?.labels}
      labelType={rest.labelType ?? 'noteLabel'}
      id={rest.id || editorId}
      stringTitle={noteMeta?.name || rest.stringTitle}
      onInstanceInitialized={i => {
        instanceRef.current = i
        attachMeta()
        if (fetchedValue) {
          i.replaceChildren?.(fetchedValue)
          rest.onInstanceInitialized?.(i)
        }
        if (!noteId) {
          rest.onInstanceInitialized?.(i)
        }
      }}
      on={async e => {
        if (on) {
          const res = await on?.(e)
          if (res) {
            return res
          }
        }
        switch (e.type) {
          case 'chatChange':
            if (noteId) {
              await ObjectStore('note').updateOne({ id: noteId, aiChat: e.chat })
            }
            return
          case 'getMeta':
            if (noteMeta) {
              e.onSuccess(noteMeta.id)
            }
            return
          case 'deleteLabel': {
            return await deleteLabel(e.labelId)
          }
          case 'addLabel': {
            return await addLabel(e.currentLabel)
          }
          case 'drop': {
            return await handleDrop(e)
          }
          case 'AI summarize': {
            if (noteMeta) {
              MetaStore.addAIForMeta(noteMeta.id, {
                summary: e.summary.summary.summary
              })
            }
            if (noteId) {
              await ObjectStore('note').updateOne({ id: noteId, aiSummary: e.summary })
            }
            return true
          }
          case 'removeSummary': {
            if (noteMeta) {
              MetaStore.property.updateProperty(noteMeta.id, AI_SUMMARY_PROP_ID, null)
            }
            if (noteId) {
              await ObjectStore('note').updateOne({ id: noteId, aiSummary: undefined })
            }
            return true
          }
          case 'getSource': {
            return {
              type: 'note',
              objectId: noteId
            } as Partial<IGeneralSource>
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
          Global.emitEvent('editorOperationApplied', {
            noteId,
            id: editorId,
            operation: op
          })
        }
      }}
    />
  )
}

export default NoteEditor
