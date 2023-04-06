import { KEY } from '@/consts/key'
import { useDebounceFn } from '@/hooks'
import { ObjectStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import isHotkey from 'is-hotkey'
import { CSSProperties, FC, memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Content } from '@/components'

interface EditorTitleProps {
  title?: string
  description?: string
  noteId?: number
  titleEditable?: boolean
  onTitleClick?: VoidFunction
  titleContainerStyle?: CSSProperties
  titleStyle?: CSSProperties
  editable?: boolean
}
export const editorTitleWrapperClassName = css({
  maxWidth: '100%',
  minWidth: 0,
  width: 870,
  margin: 'auto',
  padding: '40px 10px 30px 50px'
})

export const EditorTitleClassName = css({
  cursor: 'text',
  wordBreak: 'break-word',
  padding: '0px 4px',
  whiteSpace: 'pre-wrap',
  fontSize: 28,
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
const EditorTitle: FC<EditorTitleProps> = ({
  title,
  description,
  noteId,
  titleEditable = true,
  onTitleClick,
  titleContainerStyle,
  titleStyle
}) => {
  const { run: debouncedUpdateNote } = useDebounceFn(ObjectStore('note').updateOne, { wait: 200 })
  const { t } = useTranslation()
  const titleRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (titleRef.current) {
      if (document.activeElement !== titleRef.current) {
        titleRef.current.textContent = title || ''
      }
    }
  }, [title])
  return (
    <Content className={editorTitleWrapperClassName} flex column gap={10} style={titleContainerStyle}>
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

export default memo(EditorTitle)
