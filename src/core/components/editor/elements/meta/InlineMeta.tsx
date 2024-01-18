import { ClassName } from 'rendevoz'
import { css } from '@emotion/css'
import { FC } from 'react'
import { RenderElementProps } from '../../slate-react'
import { MetaStore } from '@/api/stores'
import { AnimatePopover, WithBorder } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { Colors } from '@/consts'
import { ObjectActionPopover } from '@/core'

const clazzName = css({
  cursor: 'pointer',
  transition: 'color 0.2s ease',
  ':hover': {
    color: Colors.Common.SelectColor
  }
})
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
  return (
    <span {...attributes} data-meta-id={element.id} style={{ marginRight: 6, position: 'relative' }}>
      <span>
        <>
          <AnimatePopover
            positions={['top', 'bottom']}
            reposition
            content={setV =>
              metaObject && (
                <WithBorder>
                  <ObjectActionPopover onClose={() => setV(false)} metaObjectId={metaObject?.id} />
                </WithBorder>
              )
            }
          >
            <span
              className={clazzName}
              data-meta
              style={{
                color: metaObject?.color
              }}
            >
              {metaObject?.name || metaObject?.placeholderName || 'Deleted Object'}
            </span>
          </AnimatePopover>

          {metaObject && (
            <span
              style={{
                background: 'var(--button-hover-background)',
                marginLeft: 6
              }}
              className={inlineClassName}
              role="tag"
            >
              {Rendevoz.Utils.Meta.getTypeName(metaObject?.type)}
            </span>
          )}
        </>
      </span>
      {children}
    </span>
  )
}

export default InlineMetaElement
