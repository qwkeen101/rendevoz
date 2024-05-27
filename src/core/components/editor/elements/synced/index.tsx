import { RenderElementProps } from 'slate-react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { SyncedBlockElement } from '~/typings/components/editor/outerElements'
import { useLayoutEffect, useRef, useState } from 'react'
import { Editor, Node, Range, Transforms } from 'slate'
import { ReactEditor, useRenderObject, useSlate, useSlateStatic } from '@/core'
import { GlobalInstance, useDebounceEffect, useIsIn, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { Colors } from '@/consts'
import { AnimatePopover, Button, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import useCheckSyncInWhere from '@/core/components/editor/elements/synced/useCheckSyncInWhere'
import _ from 'lodash'
import { HistoryEditor } from 'slate-history'
import { useTranslation } from 'react-i18next'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import useEditorBlockHandle from '@/core/components/editor/hooks/useBlockHandle'

const SyncedBlock = ({ element, children }: RenderElementProps) => {
  const syncElement = element as SyncedBlockElement
  const editor = useSlate()
  const [blockHandle] = useEditorBlockHandle()
  const path = ReactEditor.findPath(editor, element)
  const elementRange = Editor.range(editor, path)
  const focused = !!(
    editor.selection &&
    ReactEditor.isFocused(editor) &&
    elementRange &&
    Range.includes(elementRange, Range.start(editor.selection)) &&
    Range.includes(elementRange, Range.end(editor.selection))
  )
  const syncMeta = MetaStore.useValue(syncElement.originId)
  const blockDetails = ObjectStore('syncedBlock').useValue(syncMeta?.objectId)
  const { t } = useTranslation()
  useCheckSyncInWhere(syncElement.originId)
  const handleDelete = () => {
    const path = ReactEditor.findPath(editor, element)
    Transforms.removeNodes(editor, {
      at: path
    })
  }
  const memoizedReplace = useMemoizedFn(() => {
    if (blockDetails && blockDetails.syncVersion > syncElement.syncVersion) {
      const path = ReactEditor.findPath(editor, element)
      console.log('sync yo block')
      Promise.resolve().then(() => {
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
      })
    }
  })
  useLayoutEffect(() => {
    memoizedReplace()
  }, [blockDetails?.syncVersion])

  useDebounceEffect(
    () => {
      if (
        blockDetails &&
        syncElement.syncVersion >= blockDetails.syncVersion &&
        !_.isEqual(blockDetails.blockChildren, syncElement.children)
      ) {
        const selection = editor.selection
        console.log('block to sync', syncElement, blockDetails)
        const nextVersion = blockDetails.syncVersion + 1
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

        syncMeta && MetaStore.updateMetaObject?.({ id: syncMeta.id, placeholderName: Node.string(syncElement) })
        setTimeout(() => {
          ObjectStore('syncedBlock').updateOne({
            id: blockDetails.id,
            blockChildren: structuredClone(syncElement.children),
            syncVersion: nextVersion
          })
        }, 100)
      }
    },
    [syncElement.children],
    { wait: 250 }
  )
  const [isIn, setIsIn] = useState(false)
  const [popoverVisible, setPopoverVisible] = useState(false)
  const handleUnsync = () => {
    const path = ReactEditor.findPath(editor, element)
    Transforms.unwrapNodes(editor, {
      at: path
    })
  }
  const showBlockShadow = useSelectAtomValue(EditorStateAtom, s => s.state?.showSyncBlockShadow)

  if (!syncMeta) {
    const path = ReactEditor.findPath(editor, element)
    Transforms.removeNodes(editor, { at: path })
    return null
  }

  return (
    <>
      <div data-drag={true} onPointerMove={() => setIsIn(true)} onPointerLeave={() => setIsIn(false)}>
        {children}
        <div contentEditable={'false'}>
          {showBlockShadow !== false && (
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                border: `2px solid ${focused ? Colors.Common.SelectColor : Colors.Common.SelectColorTransparent}`,
                borderRadius: 6,
                userSelect: 'none',
                opacity: focused || isIn || popoverVisible || (blockHandle.visible && blockHandle.targetId === element.id) ? 1 : 0,
                pointerEvents: 'none',
                transition: 'all 0.2s ease'
              }}
              contentEditable={'false'}
            ></div>
          )}
          <div
            contentEditable={'false'}
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              top: 0,
              left: 0,
              opacity: focused || isIn || popoverVisible ? 1 : 0,
              width: '100%',
              pointerEvents: 'none',
              zIndex: 20,
              transition: 'opacity 0.2s ease'
            }}
            className={'transparent-font font-size-12'}
          >
            <Content
              flex
              gap={4}
              style={{
                background: Colors.Background.Global,
                border: Colors.Consts.Border,
                marginLeft: 'auto',
                marginBottom: '-4px',
                padding: '3px 3px 3px 6px',
                borderRadius: 4
              }}
              contentEditable={'false'}
              alignItems={'center'}
            >
              <AnimatePopover
                onVisiblityChange={v => setPopoverVisible(v)}
                withClickCover={true}
                positions={['bottom', 'top']}
                content={
                  <WithBorder style={{ maxWidth: 300 }} padding={'4px 8px'} width={140}>
                    {blockDetails?.syncedMetaIds.map(i => <InlinePageRenderer syncMetaId={syncMeta.id} metaId={i} />)}
                  </WithBorder>
                }
              >
                <Content
                  flex
                  gap={6}
                  contentEditable={'false'}
                  style={{
                    pointerEvents: 'auto',
                    cursor: 'pointer'
                  }}
                >
                  {t('editor.sync in objects', { num: blockDetails?.syncedMetaIds.length })}
                </Content>
              </AnimatePopover>

              {editor.editorMode !== 'syncedBlock' && (
                <IconWithPopover
                  onVisiblityChange={v => setPopoverVisible(v)}
                  renderOnParent={false}
                  withClickCover={true}
                  content={setV => (
                    <WithBorder padding={6}>
                      <Button.IconButton
                        icon={'park-info'}
                        text={t('general.View details')}
                        onClick={() => {
                          setV(false)
                          GlobalInstance.metaOps?.openDetails(syncMeta.id)
                        }}
                      />
                      <Button.IconButton icon={'park-unlink'} onClick={handleUnsync} text={t('editor.unsync in this note')} />
                      <Button.IconButton icon={'park-delete-one'} text={t('general.delete')} onClick={handleDelete} dangerous />
                    </WithBorder>
                  )}
                  name={'park-more'}
                  containerStyle={{
                    background: Colors.Background.Global,
                    pointerEvents: 'auto'
                  }}
                  className={ClassName.flatButton(3, '1px 2px')}
                />
              )}
            </Content>
          </div>
        </div>
      </div>
    </>
  )
}

const InlinePageRenderer = ({ metaId, syncMetaId }: { metaId: number; syncMetaId: number }) => {
  const { renderInline } = useRenderObject({ metaObjectId: metaId })
  return renderInline({
    ellipsisLine: 1,
    containerStyle: { fontSize: 13 },
    onClick: () => {
      GlobalInstance.goBackOps?.goBackToSyncBlock(syncMetaId, metaId)
    }
  })
}
export default SyncedBlock
