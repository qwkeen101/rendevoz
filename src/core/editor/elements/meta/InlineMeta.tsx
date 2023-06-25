import { TypeToTypeName } from '@/core/database'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { FC, useEffect, useMemo, useState } from 'react'
import { InlineMetaObjectElement } from '~/typings/editor/outerElements'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import tinycolor from 'tinycolor2'
import HoverObjectDetails from '@/core/database/HoverObjectDetails'
import { MetaStore } from '@/stores'
import { Content, Image } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import HoverAttachment from '@/core/database/HoverAttachment'
import { Editor } from 'slate'
import { useEventHandler, useScopedEventEmitter } from '@/events'
import { useDebounceFn } from '@/hooks'

const clazzName = css([
  {
    cursor: 'pointer',
    fontWeight: 600,
    ':hover': {
      textDecoration: 'underline'
    }
  },
  ClassName.ellipsisFont(2)
])
const nameClassName = css([
  ClassName.objectTag,
  {
    pointerEvents: 'none',
    fontSize: '0.78em',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    padding: '0.2em 0.6em !important',
    margin: 'auto'
  }
])
const circleClassName = css({
  borderRadius: '50%',
  width: '1em',
  height: '1em',
  margin: 'auto',
  flexShrink: 0,
  padding: 3
})
const imageClassName = css({
  borderRadius: 6,
  marginTop: 6
})
const InlineMetaElement: FC<RenderElementProps> = ({ element, children, attributes }) => {
  const metaObject = MetaStore.useValue((element as InlineMetaObjectElement).originId)
  const { t } = useTranslation()

  // const { circleColor, innerColor } = useMemo(() => {
  //   if (!metaObject?.color) {
  //     return {
  //       circleColor: '#6d6d6d',
  //       innerColor: Colors.Background.Light
  //     }
  //   } else {
  //     const color = tinycolor(metaObject.color)
  //     const defaultColor = color.lighten(20).setAlpha(0.7).toRgbString()
  //     const darken = tinycolor(metaObject.color).setAlpha(0.5)
  //     return {
  //       innerColor: `${darken.toRgbString()}`,
  //       circleColor: defaultColor
  //     }
  //   }
  // }, [metaObject?.color])

  return (
    <span {...attributes} data-meta-id={element.id} style={{ margin: '0 6px 0px 2px', position: 'relative' }}>
      <div
        style={{
          display: 'inline-flex',
          gap: metaObject?.coverImgSrc ? 12 : 6,
          alignItems: metaObject?.coverImgSrc ? 'center' : 'baseline',
          maxWidth: 'calc(100% - 20px)'
        }}
      >
        {metaObject?.coverImgSrc && <Image preview src={metaObject.coverImgSrc} width="3.4em" className={imageClassName} />}
        {/* {metaObject?.coverImgSrc ? (
          <Image preview src={metaObject.coverImgSrc} width="3.4em"  />
        ) : (
          <div
            className={circleClassName}
            style={{
              background: innerColor,
              border: `0.3em solid ${circleColor}`
            }}
          ></div>
        )} */}
        {metaObject?.coverImgSrc ? (
          <Content flex column gap="0.2em" style={{ alignSelf: 'flex-end' }}>
            <Content flex gap={6}>
              <div role="tag" style={{ width: 'fit-content', margin: 0, fontSize: '0.8em' }} className={nameClassName}>
                {t(`general.${TypeToTypeName[metaObject?.type || 'normal']}`)}
              </div>
              {metaObject.attachments?.length ? (
                <HoverAttachment metaId={metaObject.id}>
                  <div
                    style={{
                      width: 'fit-content',
                      margin: 0,
                      fontSize: '0.8em',
                      cursor: 'pointer',
                      pointerEvents: 'auto'
                    }}
                    role="tag"
                    className={nameClassName}
                  >
                    {`${metaObject.attachments.length} ${t(`general.att`)}`}
                  </div>
                </HoverAttachment>
              ) : null}
            </Content>
            <HoverObjectDetails metaObjectId={(element as InlineMetaObjectElement).originId}>
              <span
                className={clazzName}
                data-meta
                onClick={() => {
                  metaObject?.id && Rendevoz.Actions.Open.Meta.openMetaObject(metaObject.id)
                }}
                style={{
                  color: metaObject?.color,
                  lineHeight: 1.2,
                  marginBottom: '-0.12em',
                  width: 'fit-content'
                }}
              >
                {metaObject?.name || 'Deleted Object'}
              </span>
            </HoverObjectDetails>
          </Content>
        ) : (
          <>
            <HoverObjectDetails metaObjectId={(element as InlineMetaObjectElement).originId}>
              <span
                className={clazzName}
                data-meta
                onClick={() => {
                  metaObject?.id && Rendevoz.Actions.Open.Meta.openMetaObject(metaObject.id)
                }}
                style={{
                  color: metaObject?.color
                }}
              >
                {metaObject?.name || 'Deleted Object'}
              </span>
            </HoverObjectDetails>

            <div className={nameClassName} role="tag">
              {t(`general.${TypeToTypeName[metaObject?.type || 'normal']}`)}
            </div>
            {metaObject?.attachments?.length ? (
              <HoverAttachment metaId={metaObject.id}>
                <div style={{ width: 'fit-content', cursor: 'pointer', pointerEvents: 'auto' }} role="tag" className={nameClassName}>
                  {`${metaObject.attachments.length} ${t(`general.att`)}`}
                </div>
              </HoverAttachment>
            ) : null}
          </>
        )}
      </div>

      {children}
    </span>
  )
}

export default InlineMetaElement
