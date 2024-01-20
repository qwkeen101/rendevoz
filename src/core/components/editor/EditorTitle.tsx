import { KEY } from '@/consts/key'
import { useDebounceFn } from '@/hooks'
import { css } from '@emotion/css'
import isHotkey from 'is-hotkey'
import { forwardRef, memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Content } from '@/components'
import { ForwardRefComponent } from 'framer-motion'
import { CustomEditor, EditorProps } from '~/typings'
import useReadOnlyEditor from './hooks/useReadOnly'
import { Colors } from '@/consts'
import MetaPropDisplayer from '@/core/object/renderer/properties/MetaPropDisplayer'
import { useSelectSetting } from '@/core'

type EditorTitleProps = EditorProps['title'] & {
  editor: CustomEditor
  stringTitle?: string
  showProps?: boolean
  propsMetaId?: number
}
export const editorTitleWrapperClassName = css({
  maxWidth: '100%',
  minWidth: 0,
  width: 'max(var(--editor-max-width), 870px)',
  margin: 'auto',
  padding: '40px 10px 30px 50px'
})

export const EditorTitleClassName = css({
  cursor: 'text',
  wordBreak: 'break-word',
  padding: '0px',
  whiteSpace: 'pre-wrap',
  fontSize: '1.5rem',
  fontWeight: 700,
  lineHeight: '1.2',
  minHeight: '1em',
  outline: 'none',
  ':empty': {
    WebkitTextFillColor: Colors.Font.SuperTransparent,
    ':after': {
      content: 'attr(placeholder)'
    }
  }
})
const EditorTitle: ForwardRefComponent<HTMLDivElement, EditorTitleProps> = forwardRef(
  (
    { titleEditable = true, titleContainerStyle, customTitleRenderer, titleStyle, stringTitle, editor, showProps = false, propsMetaId },
    ref
  ) => {
    const { run: debouncedUpdateNote } = useDebounceFn(
      (update: string) => {
        editor.on({ type: 'titleChange', value: update || 'Untitled' })
      },
      { wait: 200 }
    )
    const { t } = useTranslation()
    const readOnly = useReadOnlyEditor()
    const titleRef = useRef<HTMLDivElement>(null)
    const showCustomProps = useSelectSetting(s => s.object.showPropertiesInComponentPage)
    useEffect(() => {
      if (titleRef.current) {
        if (document.activeElement !== titleRef.current) {
          titleRef.current.textContent = stringTitle === 'Untitled' ? '' : stringTitle || ''
        }
      }
    }, [stringTitle])
    return (
      <Content
        className={editorTitleWrapperClassName}
        flex
        column
        gap={10}
        style={{
          width: 'var(--editor-max-width)',
          padding: '25px 0px 20px',
          ...titleContainerStyle
        }}
        ref={node => (editor.titleEle = node)}
      >
        {customTitleRenderer ? (
          customTitleRenderer(stringTitle || 'Untitled')
        ) : (
          <div
            contentEditable={titleEditable && !readOnly}
            style={titleStyle}
            ref={titleRef}
            onInput={e => {
              const text = (e.target as HTMLDivElement).textContent
              debouncedUpdateNote(text || '')
            }}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            spellCheck="false"
            className={EditorTitleClassName}
            placeholder={t('editor.untitled')}
            suppressContentEditableWarning={true}
          />
        )}
        {showProps && showCustomProps && propsMetaId && <MetaPropDisplayer style={{ marginTop: 12 }} metaId={propsMetaId} />}
      </Content>
    )
  }
)

export default memo(EditorTitle)
