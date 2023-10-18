import { AnimatePopover, Button, Content, Icon, Slider, Switch, WithBorder } from '@/components'
import { slateToMarkdown } from '@/core/editor/plugins/slateToMarkdown'
import useEditorInstance from '@/core/editor/hooks/useEditorInstance'
import { useTranslation } from 'react-i18next'
import { CustomEditor } from '~/typings'
import useEditorState from '@/core/editor/hooks/useEditorState'
import TypefaceSetting from '@/core/editor/components/setting/TypefaceSetting'
import { useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'
import PageSetting from '@/core/editor/components/setting/PageSetting'
import translateWholePage from '@/core/editor/utils/translateWholePage'
import ClassName from '@/styles/classNames'

const EditorSetting = ({ editor }: { editor: CustomEditor }) => {
  const { t } = useTranslation()
  const instance = useEditorInstance()
  const [editorState, setEditorState] = useEditorState()
  const parentRef = useRef(null)
  const update = useUpdate()
  useEffect(() => {
    update()
  }, [])
  return (
    <Content ref={parentRef} style={{ fontSize: 14 }}>
      <AnimatePopover
        padding={10}
        parentElement={parentRef.current}
        content={
          <WithBorder padding={6}>
            <TypefaceSetting editor={editor} />
          </WithBorder>
        }
        align={'start'}
        positions={['left', 'right']}
      >
        <Button.IconButton text={t('general.Typeface')} icon={'park-add-text'} />
      </AnimatePopover>
      <AnimatePopover
        padding={10}
        parentElement={parentRef.current}
        content={
          <WithBorder padding={6}>
            <PageSetting editor={editor} />
          </WithBorder>
        }
        align={'start'}
        positions={['left', 'right']}
      >
        <Button.IconButton text={t('general.Page style')} icon={'park-format'} />
      </AnimatePopover>
      {editorState?.header?.display?.translate !== false && (
        <Button.IconButton
          text={t('general.Translate document')}
          icon={'park-translate'}
          onClick={() => translateWholePage(editor, instance)}
        />
      )}
      <Button.IconButton
        text={t('general.Export as PDF')}
        icon="park-file-pdf"
        onClick={() => {
          instance.printToPDF?.()
        }}
      />
      <Button.IconButton
        text={t('general.Export as Markdown')}
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
        }}
      />
    </Content>
  )
}

export default EditorSetting
