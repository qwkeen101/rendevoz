import { ObjectStore } from '@/api/stores'
import useEditorInstance from '../hooks/useEditorInstance'
import { Content, VirtualList } from '@/components'
import { memo, useEffect } from 'react'
import { useRenderLabel } from '@/core/object'
import { EditorHighlightsAtom } from '@/scenes/editor/useEditorFilter'
import { usePrevious, useSelectAtomValue } from '@/hooks'
import Colors from '@/consts/colors'
import { css } from '@emotion/css'
import { Transforms } from 'slate'

const EditorLabelController = memo(({ labelIds, labelType }: { labelIds?: number[]; labelType: string }) => {
  return (
    <Content fullHeight fullWidth>
      {labelIds && labelType && (
        <VirtualList
          estimateSize={140}
          childrenContainerClassname={css({
            '>': {
              ':not(:last-child)': {
                borderBottom: `1px solid ${Colors.Background.Border}`
              }
            }
          })}
          renderItem={item => <Label labelId={item} type={labelType} />}
          style={{ width: '100%', height: '100%', paddingRight: 8, paddingLeft: 8 }}
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
    <Content ref={ref} flex column style={{ padding: '8px 0px 0px' }} gap={8}>
      {renderOriginalText({ text: label?.selectedText || '' })}
      <Content flex alignItems="center" justifyContent="space-between" gap={10}>
        {renderName({})}
        {renderPopover({
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
