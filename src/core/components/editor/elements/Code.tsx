import { FC, useRef, useState } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../slate-react'
import { CodeLanguageData } from '@/components/base/CodeBlock'
import { CustomElement } from '~/typings'
import { Transforms } from 'slate'
import { RefEditorInstance } from '@uiw/react-monacoeditor'
import { useSetting } from '@/core/setting'
import Colors from '@/consts/colors'
import { Content, Icon } from '@/components'
import Select from '@/components/base/select'
import { capitalize } from 'lodash'
import FontSize from '@/consts/font'
import useReadOnlyEditor from '../hooks/useReadOnly'
import CodeEditor from '@/core/components/code/CodeEditor'
import { CodeLangs} from '@/core/components/code/CodeHeader'

const Code: FC<RenderElementProps> = ({ element, attributes, children }) => {
  const codeEle = element as CustomElement & { type: 'code-block' }
  const editor = useSlateStatic()
  return (
    <div
      className="editor-disable-format"
      style={{
        border: '1px solid var(--border-background)',
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
          padding: '5px 5px 0px'
        }}
        onClick={() => ReactEditor.blur(editor)}
      >
        <Content gap={10} flex alignItems="center" style={{ fontSize: FontSize['13px'] }}>
          <Select
            closeOnSelect
            value={codeEle.language || 'typescript'}
            menuStyle={{
              overflowY: 'auto',
              maxHeight: 300
            }}
            options={CodeLangs.sort().map(i => ({
              value: i,
              children: capitalize(i)
            }))}
            align={"center"}
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
        </Content>
      </Content>
      <div style={{ width: '100%', minHeight: 50 }}>
        <CodeEditor
          // editable={!readonly}
          language={codeEle.language}
          value={codeEle.content}
          onChange={v => {
            console.log(v)
            Transforms.setNodes(
              editor,
              {
                content: v
              },
              {
                at: ReactEditor.findPath(editor, element)
              }
            )
          }}
        />
      </div>
      {children}
    </div>
  )
}

export default Code
