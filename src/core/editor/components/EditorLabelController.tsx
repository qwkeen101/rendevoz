import { ObjectStore } from '@/stores'
import useEditorInstance from '../hooks/useEditorInstance'
import { Content, VirtualList } from '@/components'
import { memo, useEffect, useState } from 'react'
import { EditorProps } from '~/typings'
import { useRenderLabel } from '@/core/object'
import { EditorHighlightsAtom } from '@/scenes/editor/useEditorFilter'
import { usePrevious, useSelectAtomValue } from '@/hooks'
import Colors from '@/consts/colors'
import { css } from '@emotion/css'
import { Transforms } from 'slate'
import { getObjectById } from '@/stores/object.store'
import { EditorStateAtom } from '@/core/editor/hooks/useEditorState'

const EditorLabelController = memo(() => {
  const labels = useSelectAtomValue(EditorStateAtom, s => s.labelIds)
  const labelType = useSelectAtomValue(EditorStateAtom, s => s.labelType) || 'noteLabel'
  console.log(labels)
  return (
    <Content fullHeight fullWidth>
      {labels && labelType && (
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
          items={labels}
        ></VirtualList>
      )}
    </Content>
  )
})

const Label = memo(({ labelId, type }: { labelId: number; type: string }) => {
  const label = ObjectStore(type).useValue(labelId)
  const highlightId = label?.highlightId || labelId
  const instance = useEditorInstance()
  const highlight = useSelectAtomValue(EditorHighlightsAtom, s => s.get(highlightId))
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
  const previousHighlight = usePrevious(highlight)
  useEffect(() => {
    if (previousHighlight?.str) {
      if (!highlight?.str) {
        instance.labelOps?.deleteLabel(labelId)
      }
    }
  }, [highlight])

  return (
    <Content ref={ref} flex column style={{ padding: '8px 0px 0px' }} gap={8}>
      {highlight?.str && renderOriginalText({ text: highlight.str })}
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
