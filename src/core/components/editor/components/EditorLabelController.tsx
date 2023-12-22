import { ObjectStore } from '@/api/stores'
import useEditorInstance from '../hooks/useEditorInstance'
import { Button, Content, VirtualList } from '@/components'
import { memo, useEffect, useRef } from 'react'
import { useRenderLabel } from '@/core/object'
import { useSelectAtomValue } from '@/hooks'
import Colors from '@/consts/colors'
import { css } from '@emotion/css'
import { Transforms } from 'slate'
import { Virtualizer } from '@tanstack/react-virtual'
import { EditorBarStateAtom } from '@/core/components/editor/hooks/useEditorBarState'
import { useTranslation } from 'react-i18next'
import LabelStore from '@/api/stores/label.store'

const EditorLabelController = memo(({ labelIds, labelType }: { labelIds?: number[]; labelType: string }) => {
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  const currentActiveLabel = useSelectAtomValue(EditorBarStateAtom, s => s.currentActiveLabelId)
  useEffect(() => {
    if (currentActiveLabel) {
      const idx = labelIds?.findIndex(i => i === currentActiveLabel)
      if (idx !== undefined && idx >= 0) {
        virtualizerRef.current?.scrollToIndex(idx, { align: 'center' })
      }
    }
  }, [currentActiveLabel])
  const { t } = useTranslation()
  return (
    <Content fullHeight fullWidth>
      <Content flex alignItems={'center'} style={{ padding: '4px 6px 0px', lineHeight: 1.3 }} justifyContent={'space-between'}>
        <div
          style={{
            fontSize: 14
          }}
        >
          {t('general.labels')}
        </div>
        {labelIds?.length ? (
          <Button.IconButton
            style={{
              fontSize: 13,
              color: Colors.Font.Transparent
            }}
            onClick={() => {
              labelIds && LabelStore.exportLabels(labelIds, labelType)
            }}
            text={t('general.Export all labels')}
            icon={'park-efferent-three'}
          />
        ) : null}
      </Content>
      {labelIds && labelType && (
        <VirtualList
          estimateSize={140}
          itemContainerClassname={css({
            '> div': {
              ':not(:last-child)': {
                borderBottom: `1px solid ${Colors.Background.Border}`
              }
            }
          })}
          paddingEnd={300}
          ref={virtualizerRef}
          renderItem={item => <Label labelId={item} type={labelType} />}
          style={{ width: '100%', height: '100%', paddingRight: 4, paddingLeft: 4, paddingTop: 2 }}
          items={labelIds}
        ></VirtualList>
      )}
    </Content>
  )
})

const Label = memo(({ labelId, type }: { labelId: number; type: string }) => {
  const label = ObjectStore(type).useValue(labelId)
  const highlightId = labelId
  const instance = useEditorInstance()
  const currentActive = useSelectAtomValue(EditorBarStateAtom, s => s.currentActiveLabelId)

  const { renderName, renderAttachment, renderDescription, renderPopover, renderOriginalText, ref } = useRenderLabel({
    objectId: labelId,
    type,
    onDragStart: () => {
      const editor = instance.getSlateEditor?.()
      if (editor) {
        editor.on?.({ type: 'labelDrag', labelId })
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
      style={{
        padding: '6px 4px',
        borderRadius: 6,
        transition: 'box-shadow 0.35s ease',
        boxShadow: currentActive === labelId ? `0 0 0 2px ${Colors.Common.SelectColor}` : undefined
      }}
      gap={8}
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
                instance.labelOps?.deleteLabel(labelId)
              }
            }
          }
        })}
      </Content>

      {renderDescription({})}
      {renderAttachment({
        renderAttOnParent: false,
        renderObjectDetailsOnParent: false
      })}
    </Content>
  )
})
export default EditorLabelController
