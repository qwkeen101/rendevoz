import { CSSProperties, useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'
import Colors from '../../../../consts/colors'
import HoverObjectDetails from '@/core/object/HoverObjectDetails'
import { Rendevoz } from '@/core/rendevoz'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import HoverAttachment from '@/core/object/HoverAttachment'
import { MetaObject } from '~/typings'
import { useTranslation } from 'react-i18next'

export type InlineRendererProps = {
  containerStyle?: CSSProperties
  ellipsisLine?: number
  showCircle?: boolean
  showUnderline?: boolean
  showHoverObjectDetails?: boolean
  renderAttOnParent?: boolean
  renderObjectDetailsOnParent?: boolean
  reverse?: boolean
  onClick?: React.MouseEventHandler
}

const clazzName = css({
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'color 0.2s ease',
  ':hover': {
    color: Colors.Common.SelectColor
  }
})

export default (
  {
    containerStyle,
    ellipsisLine,
    showCircle,
    showUnderline,
    showHoverObjectDetails,
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
      <HoverObjectDetails
        parentElmentRef={renderObjectDetailsOnParent ? containerRef : undefined}
        metaObjectId={metaObject?.id}
        disable={!showHoverObjectDetails}
      >
        <span
          role="meta-name"
          data-meta
          onClick={e => {
            if (onClick) {
              onClick(e)
              return
            }
            metaObject?.id && Rendevoz.Actions.Open.Meta.openMetaObject(metaObject.id)
          }}
          className={css([clazzName, ClassName.ellipsisFont(ellipsisLine || 2)])}
          style={{
            color: metaObject?.color,
            textTransform: 'none',
            textDecoration: showUnderline === false ? 'none' : undefined
          }}
        >
          {metaObject?.name || 'Deleted Object'}
        </span>
      </HoverObjectDetails>
      <div
        style={{
          textTransform: 'capitalize',
          pointerEvents: 'none',
          fontSize: 10,
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
        <HoverAttachment parentElement={renderAttOnParent ? containerRef.current : undefined} metaId={metaObject.id}>
          <div
            style={{
              textTransform: 'capitalize',
              pointerEvents: 'auto',
              cursor: 'pointer',
              fontSize: 10,
              whiteSpace: 'nowrap',
              lineHeight: 1,
              padding: '3px 8px',
              margin: 'auto 0'
            }}
            className={ClassName.objectTag}
          >
            {`${metaObject.attachments.length} ${t(`general.att`)}`}
          </div>
        </HoverAttachment>
      ) : null}
    </div>
  )
}
