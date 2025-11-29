import { RenderElementProps } from 'slate-react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { SyncedBlockElement } from '~/typings/components/editor/outerElements'
import { useLayoutEffect, useState } from 'react'
import { Editor, Node, Range, Transforms } from 'slate'
import { InlineObject, ReactEditor, useSlate } from '@/core'
import { useDebounceEffect, useIsIn, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { Colors, Icons } from '@/consts'
import { AnimatePopover, Button, Icon, IconWithPopover, WithBorder } from '@/components'
import useCheckSyncInWhere from '../elements/synced/useCheckSyncInWhere'
import _ from 'lodash'
import { HistoryEditor } from 'slate-history'
import { useTranslation } from 'react-i18next'
import { EditorStateAtom } from '../hooks/useEditorState'
import useEditorBlockHandle from '../hooks/useBlockHandle'
import trans from '@/consts/trans'

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
  const { ref, isIn } = useIsIn()
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
      <div data-drag={true} ref={ref}>
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
            className={
              'flex absolute top-0 right-0 items-center pointer-events-none gap-1 transition-opacity transparent-font font-size-12 z-20'
            }
            style={{
              marginLeft: 'auto',
              marginBottom: '-4px',
              opacity: focused || isIn || popoverVisible ? 1 : 0
            }}
            contentEditable={'false'}
          >
            <AnimatePopover
              onVisiblityChange={v => setPopoverVisible(v)}
              parentElement={ref.current}
              positions={['bottom', 'top']}
              padding={6}
              content={
                <WithBorder className={'popover-menu flex flex-col gap-0.5 px-2 !py-2'}>
                  {blockDetails?.syncedMetaIds.map(i => (
                    <InlineObject
                      onClick={() => {
                        Global.goBackOps.goBackToSyncBlock(syncMeta.id, i)
                      }}
                      id={i}
                      key={i}
                    />
                  ))}
                </WithBorder>
              }
            >
              <div className={'pointer-events-auto cursor-pointer mr-1'}>
                {t('editor.sync in objects', { num: blockDetails?.syncedMetaIds.length })}
              </div>
            </AnimatePopover>

            {editor.editorMode !== 'syncedBlock' && (
              <>
                <Icon
                  tooltip={t(trans.CopyLink)}
                  name={Icons.Link}
                  size={14}
                  className={'square-button pointer-events-auto'}
                  onClick={() => {
                    Global.metaOps.copyLink?.(syncMeta.id)
                  }}
                />
                <IconWithPopover
                  size={14}
                  onVisiblityChange={v => setPopoverVisible(v)}
                  withClickCover={true}
                  placement={['bottom', 'top']}
                  content={setV => (
                    <WithBorder className={'popover-menu-mid px-1'}>
                      <Button.IconButton
                        icon={Icons.Info}
                        text={t(trans.Meta.ViewDetails)}
                        onClick={() => {
                          setV(false)
                          Global.metaOps.openDetails?.(syncMeta.id)
                        }}
                      />
                      <Button.IconButton icon={'park-unlink'} onClick={handleUnsync} text={t('editor.unsync in this note')} />
                      <Button.IconButton icon={Icons.Delete} text={t(trans.Delete)} onClick={handleDelete} dangerous />
                    </WithBorder>
                  )}
                  name={Icons.More}
                  className={'square-button pointer-events-auto'}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
export default SyncedBlock
