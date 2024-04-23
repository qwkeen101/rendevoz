import { AnimatePopover, Button, Content, Icon, Slider, Switch, WithBorder } from '@/components'
import { slateToMarkdown } from '@/core/components/editor/plugins/slateToMarkdown'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { useTranslation } from 'react-i18next'
import { CustomEditor } from '~/typings'
import useEditorState from '@/core/components/editor/hooks/useEditorState'
import TypefaceSetting from '@/core/components/editor/components/setting/TypefaceSetting'
import { useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'
import PageSetting from '@/core/components/editor/components/setting/PageSetting'
import translateWholePage from '@/core/components/editor/utils/translateWholePage'
import ClassName from '@/styles/classNames'
import { DateFormat } from '@/utils'

const EditorSetting = ({ editor }: { editor: CustomEditor }) => {
  const { t } = useTranslation()
  const instance = useEditorInstance()
  const [editorState, setEditorState] = useEditorState()
  const parentRef = useRef(null)
  const update = useUpdate()
  const { lastSavedAt } = editorState.state || {}
  useEffect(() => {
    update()
  }, [])
  return (
    <Content ref={parentRef}>
      <Content style={{ padding: 4 }} className={lastSavedAt ? 'border-bottom' : undefined}>
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
      {lastSavedAt ? (
        <Content
          className={'font-size-12 transparent-font'}
          style={{
            padding: '4px 10px'
          }}
        >
          <div>{t('general.Last saved at')}</div>
          <div>{DateFormat.format(lastSavedAt, DateFormat.Formats.withSecond)}</div>
        </Content>
      ) : null}
    </Content>
  )
}

export default EditorSetting
