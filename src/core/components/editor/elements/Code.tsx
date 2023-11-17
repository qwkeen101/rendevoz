import { FC, useRef, useState } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../slate-react'
import CodeBlock, { CodeLanguageData } from '@/components/base/CodeBlock'
import { CustomElement } from '~/typings'
import { Transforms } from 'slate'
import { RefEditorInstance } from '@uiw/react-monacoeditor'
import { useSetting } from '@/core/setting'
import Colors from '@/consts/colors'
import { Button, Content, Icon } from '@/components'
import Select from '@/components/base/select'
import { capitalize } from 'lodash'
import FontSize from '@/consts/font'
import useReadOnlyEditor from '../hooks/useReadOnly'

const Code: FC<RenderElementProps> = ({ element, attributes, children }) => {
  const codeEle = element as CustomElement & { type: 'code-block' }
  const editor = useSlateStatic()
  const editorRef = useRef<RefEditorInstance>(null)
  const [height, setHeight] = useState(300)

  const [setting] = useSetting()
  const readonly = useReadOnlyEditor()
  return (
    <div
      className="editor-disable-format"
      // contentEditable={false}
      style={{
        background: codeEle.editorBackground || Colors.Background.Secondary,
        borderRadius: 8,
        overflow: 'hidden'
      }}
      contentEditable={false}
    >
      <Content
        flex
        alignItems="center"
        justifyContent="space-between"
        gap={20}
        style={{
          padding: '4px 12px 4px 25px',
          borderBottom: `1px solid ${Colors.Background.Border}`
        }}
        onClick={() => ReactEditor.blur(editor)}
      >
        <Content flex gap={8} auto>
          <Icon name="park-code" />
          <input
            style={{
              outline: 'none',
              border: 'none',
              padding: 0,
              background: 'transparent',
              flex: 1
            }}
            placeholder="Input Title"
            onChange={e =>
              Transforms.setNodes(
                editor,
                {
                  title: e.target.value
                },
                {
                  at: ReactEditor.findPath(editor, element)
                }
              )
            }
            defaultValue={codeEle.title}
          ></input>
        </Content>
        <Content gap={10} flex alignItems="center" style={{ fontSize: FontSize['13px'] }}>
          <Select
            closeOnSelect
            value={codeEle.language || 'typescript'}
            menuStyle={{
              overflowY: 'auto',
              maxHeight: 400
            }}
            options={CodeLanguageData.map(i => ({
              value: i,
              children: capitalize(i)
            }))}
            onSelect={v =>
              Transforms.setNodes(
                editor,
                {
                  language: v[0]
                },
                {
                  at: ReactEditor.findPath(editor, element)
                }
              )
            }
          ></Select>
          <Button.IconButton
            onClick={() => {
              editorRef.current?.editor?.getAction('editor.action.formatDocument')?.run()
            }}
            text="Format Code"
            icon="park-format"
          />
        </Content>
      </Content>
      <div contentEditable style={{ minHeight: 300, height, width: '100%' }}>
        <CodeBlock
          ref={editorRef}
          language={codeEle.language || 'typescript'}
          value={codeEle.content}
          height="100%"
          darkMode={setting.general.darkMode}
          editable={!readonly}
          onChange={v => {
            if (v !== undefined) {
              const height = editorRef.current?.editor?.getContentHeight()
              if (height) {
                setHeight(Math.max(Math.min(800, height), 300))
              }
              Transforms.setNodes(
                editor,
                {
                  content: v
                },
                {
                  at: ReactEditor.findPath(editor, element)
                }
              )
            }
          }}
        />
      </div>
      {children}
    </div>
  )
}

export default Code
