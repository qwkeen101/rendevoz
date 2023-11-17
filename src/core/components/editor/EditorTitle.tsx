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

type EditorTitleProps = EditorProps['title'] & {
  editor: CustomEditor
  stringTitle?: string
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
    WebkitTextFillColor: 'rgba(55,53,47,0.15)',
    ':after': {
      content: 'attr(placeholder)'
    }
  }
})
const EditorTitle: ForwardRefComponent<HTMLDivElement, EditorTitleProps> = forwardRef(
  ({ titleEditable = true, titleContainerStyle, customTitleRenderer, titleStyle, stringTitle, editor }, ref) => {
    const { run: debouncedUpdateNote } = useDebounceFn(
      (update: string) => {
        editor.on({ type: 'titleChange', value: update })
      },
      { wait: 200 }
    )
    const { t } = useTranslation()
    const readOnly = useReadOnlyEditor()
    const titleRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
      if (titleRef.current) {
        if (document.activeElement !== titleRef.current) {
          titleRef.current.textContent = stringTitle || ''
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
          padding: '40px 0px 20px',
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
            onBlur={() => {
              if (titleRef.current?.textContent === '') {
                titleRef.current && (titleRef.current.textContent = t('general.untitled'))
              }
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
      </Content>
    )
  }
)

export default memo(EditorTitle)
