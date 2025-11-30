import { KEY } from '../consts/key'
import { useDebounceFn, useGlobalAtomValue } from '@/hooks'
import { css } from '@emotion/css'
import isHotkey from 'is-hotkey'
import { forwardRef, memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Content } from '@/components'
import { CustomEditor, EditorProps } from '~/typings'
import useReadOnlyEditor from '../hooks/useReadOnly'
import MetaPropDisplayer from '@/core/object/renderer/properties/MetaPropDisplayer'
import { GlobalSetting, ReactEditor } from '@/core'
import { Transforms } from 'slate'
import Id from './utils/id'
import classnames from 'classnames'
import trans from '../consts/trans'
import useEditorInstance from '../hooks/useEditorInstance'

type EditorTitleProps = EditorProps['title'] & {
  editor: CustomEditor
  stringTitle?: string
  showProps?: boolean
  propsMetaId?: number
}

export const EditorTitleClassName = css({
  cursor: 'text',
  wordBreak: 'break-word',
  padding: '0px',
  whiteSpace: 'pre-wrap',
  fontSize: '1.6em',
  fontWeight: 700,
  lineHeight: '1.5',
  minHeight: '1em',
  outline: 'none',
  ':empty': {
    WebkitTextFillColor: 'var(--font-placeholder)',
    ':after': {
      content: 'attr(placeholder)'
    }
  }
})
const EditorTitle = forwardRef<HTMLDivElement, EditorTitleProps>(
  (
    {
      titleEditable = true,
      titleClassName,
      titleContainerStyle,
      customTitleRenderer,
      titleStyle,
      stringTitle,
      editor,
      showProps = false,
      propsMetaId
    },
    ref
  ) => {
    const instance = useEditorInstance()
    const { run: debouncedUpdateNote } = useDebounceFn(
      (update: string) => {
        instance.on({ type: 'titleChange', value: update })
      },
      { wait: 200 }
    )
    const { t } = useTranslation()
    const readOnly = useReadOnlyEditor()
    const titleRef = useRef<HTMLDivElement>(null)
    const showCustomProps = useGlobalAtomValue(GlobalSetting.atoms.showPropertiesInComponentPage)
    useEffect(() => {
      if (titleRef.current) {
        if (document.activeElement !== titleRef.current && stringTitle) {
          titleRef.current.textContent = stringTitle
        }
      }
    }, [stringTitle])
    return (
      <Content
        className={classnames('w-full', titleClassName)}
        flex
        column
        role={'editor-title'}
        style={{
          maxWidth: 'var(--editor-max-width)',
          ...titleContainerStyle
        }}
        ref={node => (editor.titleEle = node)}
      >
        {customTitleRenderer ? (
          customTitleRenderer(stringTitle || '')
        ) : (
          <div
            contentEditable={titleEditable && !readOnly}
            style={titleStyle}
            ref={titleRef}
            onPaste={e => {
              e.preventDefault()
              const text = e.clipboardData.getData('text/plain')
              document.execCommand('insertText', false, text)
            }}
            onInput={e => {
              const text = (e.target as HTMLDivElement).textContent
              debouncedUpdateNote(text || '')
            }}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                e.preventDefault()
                e.currentTarget.blur()
                Transforms.insertNodes(
                  editor,
                  {
                    type: 'paragraph',
                    id: Id.getId(),
                    children: [{ text: '' }]
                  },
                  { at: [0] }
                )
                Transforms.select(editor, [0, 0])
                ReactEditor.focus(editor)
              }
            }}
            className={EditorTitleClassName}
            placeholder={t(trans.Untitled)}
            suppressContentEditableWarning={true}
          />
        )}
        {showProps && showCustomProps && propsMetaId && <MetaPropDisplayer style={{ marginTop: 12 }} metaId={propsMetaId} />}
      </Content>
    )
  }
)

export default memo(EditorTitle)
