import { TypeToTypeName } from '@/core/object'
import { ClassName } from 'rendevoz'
import { css } from '@emotion/css'
import { FC } from 'react'
import { InlineMetaObjectElement } from '~/typings/editor/outerElements'
import { RenderElementProps } from '../../slate-react'
import { useTranslation } from 'react-i18next'
import HoverObjectDetails from '@/core/object/HoverObjectDetails'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Image } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import HoverAttachment from '@/core/object/HoverAttachment'
import { Colors } from '@/consts'
import { useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'

const clazzName = css({
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'color 0.2s ease',
  ':hover': {
    color: Colors.Common.SelectColor
  }
})
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
const imageClassName = css({
  borderRadius: 6,
  marginTop: 6
})
const InlineMetaElement: FC<RenderElementProps> = ({ element, children, attributes }) => {
  const metaObject = MetaStore.useValue((element as InlineMetaObjectElement).originId)
  const { t } = useTranslation()
  const showDetails = useSelectAtomValue(EditorStateAtom, s => s.layout?.showHoverObjectDetails) ?? true
  const targetObject = ObjectStore(metaObject?.type).useValue(metaObject?.objectId)
  const showOriginalText = metaObject?.name === 'Unnamed Label' && targetObject?.selectedText
  if (metaObject?.coverImgSrc) {
    return (
      <span {...attributes} data-meta-id={element.id} style={{ margin: '0 6px 0px 2px', position: 'relative' }}>
        <div
          style={{
            display: 'inline-flex',
            gap: metaObject?.coverImgSrc ? 12 : 6,
            alignItems: metaObject?.coverImgSrc ? 'flex-end' : 'baseline',
            maxWidth: 'calc(100% - 20px)'
          }}
        >
          <Image preview src={metaObject.coverImgSrc} width="2.5em" className={imageClassName} />
          <Content flex column gap="0.2em" style={{ alignSelf: 'flex-end' }}>
            <Content flex gap={6}>
              <div role="tag" style={{ width: 'fit-content', margin: 0, fontSize: '0.8em' }} className={nameClassName}>
                {Rendevoz.Utils.Meta.getTypeName(metaObject.type)}
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
            <HoverObjectDetails disable={!showDetails} metaObjectId={(element as InlineMetaObjectElement).originId}>
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
                  width: 'fit-content',
                  fontStyle: showOriginalText ? 'italic' : undefined
                }}
              >
                {showOriginalText || metaObject?.name || 'Deleted Object'}
              </span>
            </HoverObjectDetails>
          </Content>
        </div>
        {children}
      </span>
    )
  }
  return (
    <span {...attributes} data-meta-id={element.id} style={{ margin: '0 6px 0px 2px', position: 'relative' }}>
      <span>
        <>
          <HoverObjectDetails disable={!showDetails} metaObjectId={(element as InlineMetaObjectElement).originId}>
            <span
              className={clazzName}
              data-meta
              onClick={() => {
                metaObject?.id && Rendevoz.Actions.Open.Meta.openMetaObject(metaObject.id)
              }}
              style={{
                color: metaObject?.color,
                fontStyle: showOriginalText ? 'italic' : undefined
              }}
            >
              {showOriginalText || metaObject?.name || 'Deleted Object'}
            </span>
          </HoverObjectDetails>

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
          {metaObject?.attachments?.length ? (
            <HoverAttachment metaId={metaObject.id}>
              <span
                style={{
                  width: 'fit-content',
                  cursor: 'pointer',
                  background: 'var(--button-hover-background)',
                  pointerEvents: 'auto',
                  marginLeft: 6
                }}
                role="tag"
                className={inlineClassName}
              >
                {`${metaObject.attachments.length} ${t(`general.att`)}`}
              </span>
            </HoverAttachment>
          ) : null}
        </>
      </span>
      {children}
    </span>
  )
}

export default InlineMetaElement
