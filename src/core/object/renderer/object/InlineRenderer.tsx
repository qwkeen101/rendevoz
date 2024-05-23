import { CSSProperties, useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'
import Colors from '../../../../consts/colors'
import { Rendevoz } from '@/core/rendevoz'
import ClassName from '@/styles/classNames'
import { MetaObject } from '~/typings'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { AnimatePopover, IconWithPopover, WithBorder } from '@/components'
import { ObjectActionMenu } from '@/core'
import { GlobalInstance } from '@/hooks'
import ContextMenu from '@/components/contextMenu'

export type InlineRendererProps = {
  containerStyle?: CSSProperties
  ellipsisLine?: number
  renderAttOnParent?: boolean
  renderObjectDetailsOnParent?: boolean
  reverse?: boolean
  onClick?: React.MouseEventHandler
}

export default (
  {
    containerStyle,
    ellipsisLine,
    onClick,
    reverse,
    metaObject
  }: InlineRendererProps & {
    metaObject?: MetaObject
  } = {
    ellipsisLine: 2,
    renderAttOnParent: false,
    renderObjectDetailsOnParent: true
  }
) => {
  const containerRef = useRef(null)
  const { t } = useTranslation()
  if (!metaObject) return null
  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        flexDirection: reverse ? 'row-reverse' : 'row',
        ...containerStyle
      }}
    >
      <ContextMenu
        content={setV => (
          <WithBorder>
            <ObjectActionMenu onClose={() => setV(false)} metaObjectId={metaObject.id} />
          </WithBorder>
        )}
      >
        <span
          data-meta
          onClick={e => {
            if (onClick) {
              onClick(e)
              e.preventDefault()
              return
            }
            e.preventDefault()
            GlobalInstance.layoutOps?.openObject(metaObject.id)
          }}
          className={classnames('hover-link', ClassName.ellipsisFont(ellipsisLine || 2))}
          style={{
            color: metaObject?.color
          }}
        >
          {metaObject?.name || metaObject?.placeholderName || t('general.Unnamed')}
        </span>
      </ContextMenu>
      <div
        style={{
          textTransform: 'capitalize',
          pointerEvents: 'none',
          fontSize: 12,
          whiteSpace: 'nowrap',
          lineHeight: 1,
          padding: '3px 6px',
          margin: 'auto 0 auto 4px'
        }}
        className={ClassName.objectTag}
      >
        {Rendevoz.Utils.Meta.getTypeName(metaObject.type)}
      </div>
    </div>
  )
}
