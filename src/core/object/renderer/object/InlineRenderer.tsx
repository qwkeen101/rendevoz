import { CSSProperties, useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'
import Colors from '../../../../consts/colors'
import { Rendevoz } from '@/core/rendevoz'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import { MetaObject } from '~/typings'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { AnimatePopover, IconWithPopover, WithBorder } from '@/components'
import { ObjectActionPopover } from '@/core'
import { GlobalInstance } from '@/hooks'

export type InlineRendererProps = {
  containerStyle?: CSSProperties
  ellipsisLine?: number
  showCircle?: boolean
  showUnderline?: boolean
  showHoverObjectDetails?: boolean
  showMoreOptions?: boolean
  renderAttOnParent?: boolean
  renderObjectDetailsOnParent?: boolean
  reverse?: boolean
  onClick?: React.MouseEventHandler
}

export default (
  {
    containerStyle,
    ellipsisLine,
    showCircle,
    showUnderline,
    showHoverObjectDetails,
    showMoreOptions,
    renderAttOnParent,
    renderObjectDetailsOnParent,
    onClick,
    reverse,
    metaObject
  }: InlineRendererProps & {
    metaObject?: MetaObject
  } = {
    ellipsisLine: 2,
    showCircle: true,
    showUnderline: true,
    showHoverObjectDetails: false,
    renderAttOnParent: false,
    renderObjectDetailsOnParent: true
  }
) => {
  const { t } = useTranslation()
  const containerRef = useRef(null)
  const update = useUpdate()
  useEffect(() => {
    if (renderAttOnParent) {
      update()
    }
  }, [renderAttOnParent])

  if (!metaObject) return null
  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'baseline',
        flexDirection: reverse ? 'row-reverse' : 'row',
        ...containerStyle
      }}
    >
      {showCircle && (
        <div
          style={{
            borderRadius: '50%',
            width: '1em',
            height: '1em',
            background: Colors.Background.Light,
            border: `0.3em solid #6d6d6d`,
            margin: 'auto 0',
            flexShrink: 0,
            padding: 3
          }}
        ></div>
      )}
      <AnimatePopover
        withClickCover={true}
        positions={['right', 'left']}
        padding={10}
        align={'start'}
        content={setV => (
          <WithBorder>
            <ObjectActionPopover onClose={() => setV(false)} metaObjectId={metaObject.id} />
          </WithBorder>
        )}
      >
        <span
          role="meta-name"
          data-meta
          onClick={e => {
            if (onClick) {
              onClick(e)
              e.preventDefault()
              return
            }
            if (showHoverObjectDetails === false) {
              e.preventDefault()
              GlobalInstance.layoutOps?.openObject(metaObject.id)
            }
          }}
          className={classnames('hover-link', ClassName.ellipsisFont(ellipsisLine || 2))}
          style={{
            color: metaObject?.color,
            textTransform: 'none',
            textDecoration: showUnderline === false ? 'none' : undefined
          }}
        >
          {metaObject?.name || metaObject?.placeholderName || 'Unnamed object'}
        </span>
      </AnimatePopover>
      <div
        style={{
          textTransform: 'capitalize',
          pointerEvents: 'none',
          fontSize: 12,
          whiteSpace: 'nowrap',
          lineHeight: 1,
          padding: '3px 8px',
          margin: 'auto 0'
        }}
        className={ClassName.objectTag}
      >
        {Rendevoz.Utils.Meta.getTypeName(metaObject.type)}
      </div>
      {metaObject?.attachments?.length ? (
        <div
          style={{
            textTransform: 'capitalize',
            pointerEvents: 'auto',
            cursor: 'pointer',
            fontSize: 12,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            padding: '3px 8px',
            margin: 'auto 0'
          }}
          className={ClassName.objectTag}
        >
          {`${metaObject.attachments.length} ${t(`general.att`)}`}
        </div>
      ) : null}
      {showMoreOptions && (
        <IconWithPopover
          size={14}
          name={'park-more'}
          placement={['right', 'left']}
          containerStyle={{
            marginLeft: 'auto'
          }}
          onClick={e => e.stopPropagation()}
          className={ClassName.flatButton(4, '3px')}
          content={setV => (
            <WithBorder
              onClick={e => {
                e.stopPropagation()
              }}
            >
              <ObjectActionPopover onClose={() => setV(false)} metaObjectId={metaObject.id} />
            </WithBorder>
          )}
        ></IconWithPopover>
      )}
    </div>
  )
}
