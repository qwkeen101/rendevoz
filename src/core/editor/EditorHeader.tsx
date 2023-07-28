import useEditorInstance from '@/core/editor/hooks/useEditorInstance'
import { Button, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import UseEditorBarState from '@/core/editor/hooks/useEditorBarState'
import useEditorState from '@/core/editor/hooks/useEditorState'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'
import { slateToMarkdown } from '@/core/editor/plugins/slateToMarkdown'
import { css } from '@emotion/css'

const EditorHeader = ({ title }: { title: string }) => {
  const instance = useEditorInstance()
  const [editorBarState, setEditorBarState] = UseEditorBarState()
  const [editorState, setEditorState] = useEditorState()
  return (
    <Content
      flex
      alignItems="center"
      style={{
        padding: '4px 12px'
      }}
      justifyContent="space-between"
    >
      <Content flex gap={20}>
        <Icon
          className={ClassName.circleButton(3, 4)}
          name={'park-left-bar'}
          onClick={() => setEditorBarState(s => ({ ...s, showLeftBar: !s.showLeftBar }))}
        />
        <div style={{ textTransform: 'none' }} className={css([ClassName.title('0.9rem'), ClassName.ellipsisFont(1)])}>
          {title}
        </div>
      </Content>
      <Content flex gap={10}>
        {!editorState.outReadOnly && (
          <Icon
            className={ClassName.circleButton(3, 4)}
            name={editorState.innerReadOnly ? 'park-edit' : 'park-book-open'}
            onClick={() => setEditorState(s => ({ ...s, innerReadOnly: !s.innerReadOnly }))}
          />
        )}
        <Icon name={'park-find'} onClick={() => instance?.toggleSearch?.()} className={ClassName.circleButton(3, 4)} />
        <Icon name={'park-label'} onClick={() => instance?.toggleLabel?.()} className={ClassName.circleButton(3, 4)} />
        <IconWithPopover
          disableNudge={true}
          padding={6}
          placement={['bottom']}
          content={
            <WithBorder padding={4} style={{ minWidth: 160, fontSize: FontSize['13px'] }}>
              <Button.IconButton
                style={{ padding: '2px 6px' }}
                text={'Export as PDF'}
                icon="park-file-pdf"
                onClick={() => {
                  instance.printToPDF?.()
                }}
              />
              <Button.IconButton
                style={{ padding: '2px 6px' }}
                text={'Export as Markdown'}
                icon="custom-markdown"
                onClick={() => {
                  const editor = instance.getSlateEditor?.()
                  if (editor) {
                    const content = slateToMarkdown(editor.children)
                    if (content) {
                      const blob = new Blob([content])
                      const a = document.createElement('a')
                      const title = instance.getTitle?.()
                      a.download = `${title || 'Untitled'}.md`
                      a.href = URL.createObjectURL(blob)
                      a.click()
                    }
                  }
                  // instance.printToPDF?.()
                }}
              />
            </WithBorder>
          }
          name={'park-more'}
          className={ClassName.circleButton(3, 4)}
        />
      </Content>
    </Content>
  )
}

export default EditorHeader
