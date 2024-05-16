import { ObjectStore } from '@/api/stores'
import useEditorInstance from '../../hooks/useEditorInstance'
import { Button, Content, Icon, VirtualList } from '@/components'
import { memo, useEffect, useMemo, useRef } from 'react'
import { useRenderLabel } from '@/core/object'
import { useSelectAtomValue } from '@/hooks'
import Colors from '@/consts/colors'
import { css } from '@emotion/css'
import { Node, Path, Transforms } from 'slate'
import { Virtualizer } from '@tanstack/react-virtual'
import { EditorBarStateAtom } from '@/core/components/editor/hooks/useEditorBarState'
import { useTranslation } from 'react-i18next'
import LabelStore from '@/api/stores/label.store'
import useRenderLabelContainer from '@/core/object/renderer/useRenderLabelContainer'
import { INoteLabel } from '~/typings'
import { ClassName } from 'rendevoz'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'

const EditorLabelContainer = memo(({ labelIds, labelType }: { labelIds?: number[]; labelType: string }) => {
  const instance = useEditorInstance()
  const state = useSelectAtomValue(EditorStateAtom, s => s.state)
  const highlightToPath = useMemo(() => {
    const highlightToPath: Record<number, Path> = {}
    const editor = instance.getSlateEditor?.()
    if (editor) {
      const iter = Node.texts(editor)
      for (const value of iter) {
        if (value && 'highlight' in value[0] && value[0].highlight) {
          const [v, path] = value
          highlightToPath[v.highlight!] = path
        }
      }
    }
    return highlightToPath
  }, [labelIds])
  const currentActiveLabel = useSelectAtomValue(EditorBarStateAtom, s => s.currentActiveLabelId)
  const { sortedLabels, renderContainer, renderSearch, renderSort, virtualizerRef } = useRenderLabelContainer<INoteLabel>(
    labelType,
    labelIds,
    {
      defaultSortMode: state?.labelSortMode ?? 'article order',
      defaultPriority: state?.labelPriority ?? 'none',
      defaultScrollOffset: state?.labelScrollOffset,
      onOffsetChange: o => {
        instance.getSlateEditor?.().on({
          type: 'updateNote',
          updater: n => ({ ...n, labelScrollOffset: o })
        })
      },
      onPriorityChange: p => {
        instance.getSlateEditor?.().on({
          type: 'updateNote',
          updater: n => ({ ...n, labelPriority: p })
        })
      },
      onSortModeChange: m => {
        instance.getSlateEditor?.().on({
          type: 'updateNote',
          updater: n => ({ ...n, labelSortMode: m })
        })
      },
      availableSorts: ['article order', 'article order in reverse', 'created at', 'updated at'],
      getPathFromLabel: label => {
        return highlightToPath[label.id]
      }
    }
  )
  useEffect(() => {
    if (currentActiveLabel) {
      const idx = sortedLabels?.findIndex(i => i.id === currentActiveLabel)
      if (idx !== undefined && idx >= 0) {
        virtualizerRef.current?.scrollToIndex(idx, { align: 'center' })
      }
    }
  }, [currentActiveLabel])
  if (!sortedLabels?.length) {
    return (
      <Content fullWidth fullHeight flex centered className={'transparent-font bold-font'}>
        No highlight
      </Content>
    )
  }
  return (
    <Content fullHeight fullWidth>
      <Content flex gap={6} alignItems={'center'} style={{ padding: 10 }} className={'font-size-14'}>
        {renderSearch()}
        {renderSort()}
        {labelIds?.length ? (
          <Icon
            onClick={() => {
              labelIds && LabelStore.exportLabels(labelIds, labelType)
            }}
            size={16}
            className={ClassName.flatButton(4, '4px')}
            name={'park-efferent-three'}
          />
        ) : null}
      </Content>
      {renderContainer(i => (
        <Label id={i.id} type={labelType} />
      ))}
    </Content>
  )
})

const Label = memo(({ id, type }: { id: number; type: string }) => {
  const label = ObjectStore(type).useValue(id)
  const highlightId = id
  const instance = useEditorInstance()
  const currentActive = useSelectAtomValue(EditorBarStateAtom, s => s.currentActiveLabelId)

  const { renderName, renderPopover, renderOriginalText, renderTags, ref } = useRenderLabel({
    objectId: id,
    type,
    onDragStart: () => {
      const editor = instance.getSlateEditor?.()
      if (editor) {
        editor.on?.({ type: 'labelDrag', labelId: id })
      }
    },
    onNavigate: () => {
      instance.scrollToHighlight?.({
        highlightId
      })
    }
  })

  return (
    <Content
      ref={ref}
      flex
      column
      className={'border-top'}
      style={{
        padding: '10px',
        transition: 'background 0.35s ease',
        background: currentActive === id ? Colors.Common.SelectColorTransparent : undefined
      }}
      gap={9}
    >
      {renderOriginalText({
        text: label?.selectedText || '',
        onClick: () => {
          instance.scrollToHighlight?.({
            highlightId
          })
        }
      })}
      <Content flex alignItems="center" justifyContent="space-between" gap={10}>
        {renderName({})}
        {renderPopover({
          style: {
            top: -4
          },
          showTag: true,
          on: event => {
            switch (event.type) {
              case 'delete': {
                const editor = instance.getSlateEditor?.()
                if (editor) {
                  const highlights = instance.getHighlightLocation?.(highlightId)
                  if (highlights?.length) {
                    highlights.forEach(i => {
                      Transforms.setNodes(
                        editor,
                        {
                          highlight: undefined
                        },
                        {
                          at: i[1]
                        }
                      )
                    })
                  }
                }
                instance.labelOps?.deleteLabel(id)
              }
            }
          }
        })}
      </Content>
      {renderTags()}
    </Content>
  )
})
export default EditorLabelContainer
