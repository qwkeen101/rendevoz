import { ObjectStore } from '@/stores'
import useEditorInstance from '../hooks/useEditorInstance'
import { Content, VirtualList } from '@/components'
import { memo, useEffect } from 'react'
import { EditorProps } from '../Editor'
import { useRenderLabel } from '@/core/database'
import useEditorState from '../hooks/useEditorState'
import { useAtomValue } from 'jotai'
import { EditorHighlightsAtom } from '@/scenes/editor/useEditorFilter'
import { usePrevious, useSelectAtomValue, useToggle } from '@/hooks'
import FontSize from '@/consts/font'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import { css } from '@emotion/css'
import { Editor, Transforms } from 'slate'

const EditorLabelController = memo(() => {
  const [editorState] = useEditorState()
  const { noteId, type } = editorState
  const note = ObjectStore('note').useValue(noteId)
  const labels = note?.labels

  return (
    <Content fullHeight fullWidth>
      {type && labels && (
        <VirtualList
          estimateSize={140}
          childrenContainerClassname={css({
            '>': {
              ':not(:last-child)': {
                borderBottom: `1px solid ${Colors.Background.Border}`
              }
            }
          })}
          renderItem={item => <Label labelId={item} type={type} />}
          style={{ width: '100%', height: '100%', paddingRight: 8 }}
          items={labels}
        ></VirtualList>
      )}
    </Content>
  )
})

const Label = memo(({ labelId, type }: { labelId: number; type: EditorProps['type'] }) => {
  const label = ObjectStore(type === 'note' ? 'noteLabel' : 'webpageLabel').useValue(labelId)
  const highlightId = label && 'highlightId' in label && label.highlightId ? label.highlightId : labelId
  const instance = useEditorInstance()
  const highlight = useSelectAtomValue(EditorHighlightsAtom, s => s.get(highlightId))
  const { renderName, renderAttachment, renderDescription, renderPopover } = useRenderLabel({
    objectId: labelId,
    type: type === 'note' ? 'noteLabel' : 'webpageLabel',
    onDragStart: () => {
      const editor = instance.getSlateEditor?.()
      if (editor) {
        editor.on?.({ type: 'highlightDrag', highlightId })
      }
    }
  })
  const [showMore, toggleShowMore] = useToggle(false)
  const { t } = useTranslation()
  const previousHighlight = usePrevious(highlight)
  useEffect(() => {
    if (previousHighlight?.str) {
      if (!highlight?.str) {
        instance.deleteLabel?.(labelId)
      }
    }
  }, [highlight])

  return (
    <Content flex column style={{ padding: '8px 0px 12px' }} gap={8}>
      <Content flex alignItems="center" justifyContent="space-between" gap={10}>
        {renderName({
          onNameClick: () => {
            instance.getHighlightLocation?.(highlightId)
            instance.scrollToHighlight?.({
              highlightId
            })
          }
        })}
        {renderPopover({
          on: event => {
            switch (event.type) {
              case 'delete': {
                const editor = instance.getSlateEditor?.()
                editor?.on({ type: 'highlightRemove', highlightId: highlightId })
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
                instance.deleteLabel?.(labelId)
              }
            }
          }
        })}
      </Content>
      {highlight?.str && (
        <div
          style={{
            fontSize: FontSize['12px'],
            padding: '4px 12px 4px',
            textTransform: 'none',
            borderLeft: `3px solid ${Colors.Font.Secondary}`,
            background: Colors.Background.ButtonHover
          }}
        >
          <div style={{ textTransform: 'none' }} className={showMore ? ClassName.ellipsisFont(999) : ClassName.ellipsisFont(2)}>
            {highlight?.str}
          </div>
          {highlight?.str.length > 80 && (
            <div
              style={{ marginLeft: 'auto', textAlign: 'end', fontSize: FontSize['12px'], cursor: 'pointer', width: 'fit-content' }}
              onClick={toggleShowMore}
            >
              {showMore ? t('editor.show less') : t('editor.show more')}
            </div>
          )}
        </div>
      )}
      {renderDescription({})}
      {renderAttachment({ renderAttOnParent: false, renderObjectDetailsOnParent: false })}
    </Content>
  )
})
export default EditorLabelController
