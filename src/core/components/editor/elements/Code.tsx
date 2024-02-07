import { FC, useState } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../slate-react'
import { CustomElement } from '~/typings'
import { Transforms } from 'slate'
import { Content } from '@/components'
import Select from '@/components/base/select'
import { capitalize } from 'lodash'
import FontSize from '@/consts/font'
import useReadOnlyEditor from '../hooks/useReadOnly'
import CodeEditor from '@/core/components/code/CodeEditor'
import { CodeLangs } from '@/core/components/code/CodeHeader'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { useIsIn } from '@/hooks'

const Code: FC<RenderElementProps> = ({ element, attributes, children }) => {
  const codeEle = element as CustomElement & { type: 'code-block' }
  const editor = useSlateStatic()
  const readOnly = useReadOnlyEditor()
  const { ref, isIn } = useIsIn()

  return (
    <div
      className="editor-disable-format"
      style={{
        border: '1px solid var(--border-background)',
        borderRadius: 8,
        paddingBottom: 24
      }}
      ref={ref}
      contentEditable={false}
    >
      {children}
      <Content
        flex
        alignItems="center"
        justifyContent="space-between"
        gap={20}
        className={'font-size-13 transparent-font'}
        style={{
          padding: '5px 5px 0px',
          fontSize: 14
        }}
        onClick={() => ReactEditor.blur(editor)}
      >
        <input
          placeholder={'Add title...'}
          defaultValue={codeEle.title}
          style={{
            width: '100%',
            opacity: codeEle.title ? 1 : isIn ? 1 : 0,
            transition: 'opacity 0.2s ease',
            paddingLeft: 4
          }}
          onBlur={e => {
            Transforms.setNodes(
              editor,
              {
                title: e.target.value
              },
              {
                at: ReactEditor.findPath(editor, editor)
              }
            )
          }}
        />
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
          containerStyle={{
            flexShrink: 0
          }}
          align={'center'}
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
      <div
        onKeyDown={e => {
          e.stopPropagation()
        }}
        onCopy={e => {
          e.stopPropagation()
        }}
        onPaste={e => {
          e.stopPropagation()
        }}
        style={{ width: '100%', minHeight: 50 }}
      >
        <CodeEditor
          editable={!readOnly}
          language={codeEle.language}
          value={codeEle.content}
          onChange={v => {
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
    </div>
  )
}

export default Code
