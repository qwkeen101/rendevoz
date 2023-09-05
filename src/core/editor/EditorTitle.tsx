import { KEY } from '@/consts/key'
import { useDebounceFn } from '@/hooks'
import { ObjectStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import isHotkey from 'is-hotkey'
import { CSSProperties, forwardRef, memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Content } from '@/components'
import { ForwardRefComponent } from 'framer-motion'
import { CustomEditor } from '~/typings'
import useReadOnlyEditor from './hooks/useReadOnly'

interface EditorTitleProps {
  title?: string
  description?: string
  noteId?: number
  titleEditable?: boolean
  onTitleClick?: VoidFunction
  titleContainerStyle?: CSSProperties
  titleStyle?: CSSProperties
  editable?: boolean
  editor: CustomEditor
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
  ({ title, description, noteId, titleEditable = true, onTitleClick, titleContainerStyle, titleStyle, editor }, ref) => {
    const { run: debouncedUpdateNote } = useDebounceFn(ObjectStore('note').updateOne, { wait: 200 })
    const { t } = useTranslation()
    const readonly = useReadOnlyEditor()
    const titleRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
      if (titleRef.current) {
        if (document.activeElement !== titleRef.current) {
          titleRef.current.textContent = title || ''
        }
      }
    }, [title])
    return (
      <Content
        className={editorTitleWrapperClassName}
        flex
        column
        gap={10}
        style={{
          width: readonly ? 'max(840px, var(--editor-max-width))' : undefined,
          paddingLeft: readonly ? 20 : undefined,
          ...titleContainerStyle
        }}
        ref={node => (editor.titleEle = node)}
      >
        <div
          style={titleStyle}
          ref={titleRef}
          onInput={e => {
            const text = (e.target as HTMLDivElement).textContent
            noteId &&
              debouncedUpdateNote({
                id: noteId,
                title: text || t('general.untitled')
              })
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
          contentEditable={titleEditable}
          onClick={onTitleClick}
        />
        {description && (
          <div style={{ paddingLeft: 4, marginTop: -4, whiteSpace: 'pre-wrap' }} className={ClassName.description()}>
            {description}
          </div>
        )}
      </Content>
    )
  }
)

export default memo(EditorTitle)
