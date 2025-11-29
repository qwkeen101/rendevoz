import { ClassName } from 'rendevoz'
import { css } from '@emotion/css'
import { FC, useEffect } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { MetaStore } from '@/api/stores'
import { WithBorder } from '@/components'
import { ObjectActionMenu } from '@/core'
import classnames from 'classnames'
import { Editor, Transforms } from 'slate'
import { HistoryEditor } from 'slate-history'
import ContextMenu from '@/components/contextMenu'
import trans from '@/consts/trans'
import { t } from 'i18next'

const clazzName = classnames(
  css({
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    ':hover': {
      color: `var(--block-font-color, var(--font-link)) !important`
    }
  }),
  'border-bottom'
)
const inlineClassName = css([
  ClassName.objectTag,
  {
    pointerEvents: 'none',
    fontSize: '0.78em',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    padding: '0.1em 0.6em !important',
    margin: 'auto'
  }
])
const InlineMetaElement: FC<RenderElementProps> = ({ element, children, attributes }) => {
  const metaObject = MetaStore.useValue(element.originId)
  const childrenText = element.children[0].text
  const editor = useSlateStatic()
  useEffect(() => {
    const n = metaObject?.name || metaObject?.placeholderName || t(trans.Unnamed)
    if (n !== childrenText) {
      const path = ReactEditor.findPath(editor, element)
      if (path) {
        HistoryEditor.withoutSaving(editor, () => {
          Editor.withoutNormalizing(editor, () => {
            Transforms.removeNodes(editor, { at: path })
            Transforms.insertNodes(
              editor,
              { ...element, children: [{ text: n }] },
              {
                at: path
              }
            )
          })
        })
      }
    }
  }, [metaObject?.name, metaObject?.placeholderName, childrenText])
  return (
    <span {...attributes} contentEditable={'false'} data-meta-id={element.id} style={{ marginRight: 6, position: 'relative' }}>
      <span>
        <>
          <ContextMenu
            content={setV =>
              metaObject && (
                <WithBorder>
                  <ObjectActionMenu onClose={() => setV(false)} metaObjectId={metaObject?.id} />
                </WithBorder>
              )
            }
          >
            <span
              onClick={() => metaObject && Global.layoutOps?.openObject(metaObject.id)}
              className={clazzName}
              data-meta
              style={{
                color: metaObject?.color
              }}
            >
              {children}
            </span>
          </ContextMenu>
          {metaObject && (
            <span
              style={{
                background: 'var(--button-hover-background)',
                marginLeft: 6
              }}
              className={inlineClassName}
              role="tag"
            >
              {Global.utils.getTypeName(metaObject?.type)}
            </span>
          )}
        </>
      </span>
      {/*{children}*/}
    </span>
  )
}

export default InlineMetaElement
