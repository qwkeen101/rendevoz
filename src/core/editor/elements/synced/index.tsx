import { RenderElementProps } from 'slate-react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { SyncedBlockElement } from '~/typings/components/editor/outerElements'
import { useEffect, useRef } from 'react'
import { Editor, Transforms } from 'slate'
import { ReactEditor, useRenderObject, useSlateStatic } from '@/core'
import { useDebounceEffect, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { Colors } from '@/consts'
import { AnimatePopover, Button, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import useCheckSyncInWhere from '@/core/editor/elements/synced/useCheckSyncInWhere'
import FontSize from '@/consts/font'
import _ from 'lodash'
import { HistoryEditor } from 'slate-history'
import { useTranslation } from 'react-i18next'
import { EditorStateAtom } from '@/core/editor/hooks/useEditorState'

const SyncedBlock = ({ element, children }: RenderElementProps) => {
  const syncElement = element as SyncedBlockElement
  const editor = useSlateStatic()
  const syncMeta = MetaStore.useValue(syncElement.originId)
  const blockDetails = ObjectStore('syncedBlock').useValue(syncMeta?.objectId)
  const { t } = useTranslation()
  useCheckSyncInWhere(syncElement.originId)
  const memoizedReplace = useMemoizedFn(() => {
    if (blockDetails && blockDetails.syncVersion > syncElement.syncVersion) {
      console.log('trigger sync to block')

      const path = ReactEditor.findPath(editor, element)
      const focused = ReactEditor.isFocused(editor)
      const prevSelection = editor.selection
      Editor.withoutNormalizing(editor, () => {
        Transforms.removeNodes(editor, {
          at: path
        })
        Transforms.insertNodes(
          editor,
          {
            ...element,
            children: structuredClone(blockDetails.blockChildren),
            syncVersion: blockDetails.syncVersion
          },
          {
            at: path
          }
        )
      })
      setTimeout(() => {
        try {
          if (focused) {
            Transforms.select(editor, prevSelection)
            ReactEditor.focus(editor)
          }
        } catch (e) {
          console.error(e)
        }
      })
    }
  })
  useEffect(() => {
    memoizedReplace()
  }, [blockDetails?.syncVersion])
  // sync debounce 1s
  useDebounceEffect(
    () => {
      if (blockDetails && !_.isEqual(blockDetails.blockChildren, syncElement.children)) {
        console.log('block to sync')
        const nextVersion = blockDetails.syncVersion + 1
        const focused = ReactEditor.isFocused(editor)
        HistoryEditor.withoutSaving(editor, () => {
          Transforms.setNodes(
            editor,
            {
              syncVersion: nextVersion
            },
            {
              at: ReactEditor.findPath(editor, element)
            }
          )
        })
        if (focused) {
          ReactEditor.focus(editor)
        }
        ObjectStore('syncedBlock').updateOne({
          id: blockDetails.id,
          blockChildren: structuredClone(syncElement.children),
          syncVersion: nextVersion
        })
      }
    },
    [syncElement.children],
    { wait: 250 }
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const handleUnsync = () => {
    const path = ReactEditor.findPath(editor, element)
    Transforms.unwrapNodes(editor, {
      at: path
    })
  }
  useEffect(() => {
    if (inputRef.current && syncMeta?.name) {
      inputRef.current.value = syncMeta.name
    }
  }, [syncMeta?.name])
  const showBlockShadow = useSelectAtomValue(EditorStateAtom, s => s.state?.showSyncBlockShadow)
  if (!syncMeta) {
    const path = ReactEditor.findPath(editor, element)
    Transforms.removeNodes(editor, { at: path })
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }} data-drag={true}>
      {showBlockShadow !== false && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              border: `2px solid ${Colors.Common.SelectColorTransparent}`,
              borderRadius: 6,
              userSelect: 'none',
              pointerEvents: 'none'
            }}
            contentEditable={false}
          ></div>
        </>
      )}
      <Content
        flex
        alignItems="center"
        justifyContent="space-between"
        contentEditable={false}
        className={ClassName.description(FontSize['12px'])}
      >
        <input
          ref={inputRef}
          placeholder={'Unnamed synced block'}
          className={ClassName.noStyleInput}
          defaultValue={syncMeta?.name}
          style={{ flex: 1 }}
          onBlur={e => MetaStore.updateMetaObject({ id: syncMeta.id, name: e.target.value }, true)}
        />

        <Content flex gap={6} style={{ fontSize: 14 }} alignItems={'center'}>
          <AnimatePopover
            positions={['bottom', 'top']}
            content={
              <WithBorder style={{ fontSize: 14 }} padding={6}>
                {blockDetails?.syncedMetaIds.map(i => <InlinePageRenderer metaId={i} />)}
              </WithBorder>
            }
          >
            <Content flex gap={6} className={ClassName.flatButton(4, '2px 6px')}>
              <Icon name={'park-transfer-data'} />
              {t('editor.sync in objects', { num: blockDetails?.syncedMetaIds.length })}
            </Content>
          </AnimatePopover>

          {editor.editorMode !== 'syncedBlock' && (
            <IconWithPopover
              content={
                <WithBorder padding={6}>
                  <Button.IconButton icon={'park-unlink'} onClick={handleUnsync} text={t('editor.unsync in this note')} />
                  <Button.IconButton icon={'park-delete'} text={t('general.delete')} dangerous />
                </WithBorder>
              }
              name={'park-more'}
              className={ClassName.flatButton(4, '2px 6px')}
            />
          )}
        </Content>
      </Content>
      {children}
    </div>
  )
}

const InlinePageRenderer = ({ metaId }: { metaId: number }) => {
  const { renderInline } = useRenderObject({ metaObjectId: metaId })
  return renderInline({})
}
export default SyncedBlock
