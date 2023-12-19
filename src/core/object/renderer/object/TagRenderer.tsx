import { css } from '@emotion/css'
import { CSSProperties, useEffect, useRef } from 'react'
import { MetaObject } from '~/typings'
import { TFunction } from 'i18next'
import { useUpdate } from 'react-use'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { ObjectTag } from '@/core'
import DateFormat from '@/utils/dateFormat'
import HoverAttachment from '@/core/object/HoverAttachment'
import { Rendevoz } from '@/core/rendevoz'

export type TagRendererProps = {
  gap?: number
  flexWrap?: CSSProperties['flexWrap']
  containerStyle?: CSSProperties
  containerClassName?: string
  showUpdatedAt?: boolean
  showCreatedAt?: boolean
  showViewAt?: boolean
  showAttachments?: boolean
  maxTagsToShow?: number
  relatedNum: number
  metaObject?: MetaObject
  t: TFunction<'translation', undefined, 'translation'>
}

const defaultTagsClass = css({
  '> *': {
    fontSize: '12px !important',
    lineHeight: '1.5 !important'
  }
})
export default ({
  gap = 4,
  flexWrap = 'wrap',
  containerStyle,
  showCreatedAt,
  showUpdatedAt,
  showViewAt,
  showAttachments,
  containerClassName = defaultTagsClass,
  relatedNum,
  metaObject,
  t
}: TagRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const update = useUpdate()
  // for attchment wrapper
  useEffect(() => {
    if (metaObject?.attachments?.length) {
      update()
    }
  }, [])
  if (!metaObject) return null
  return (
    <Content
      flex
      ref={containerRef}
      gap={gap}
      style={{
        flexWrap,
        ...containerStyle
      }}
      className={containerClassName}
    >
      <div className={ClassName.objectTag}>{Rendevoz.Utils.Meta.getTypeName(metaObject.type)}</div>
      {showCreatedAt && metaObject?.createdAt && (
        <Content flex gap={4} className={ClassName.objectTag}>
          <Icon name="park-add-one" />
          {t('general.ago', {
            time: DateFormat.formatDistanceToNowStrict(metaObject?.createdAt)
          })}
        </Content>
      )}
      {showViewAt && metaObject?.viewAt && (
        <Content flex gap={4} className={ClassName.objectTag}>
          <Icon name="park-preview-open" />
          {t('general.ago', {
            time: DateFormat.formatDistanceToNowStrict(metaObject?.viewAt)
          })}
        </Content>
      )}
      {showUpdatedAt && metaObject?.updatedAt && (
        <Content flex gap={4} className={ClassName.objectTag}>
          <Icon name="park-edit" />

          {t('general.ago', {
            time: DateFormat.formatDistanceToNowStrict(metaObject?.updatedAt)
          })}
        </Content>
      )}
      {relatedNum > 0 && (
        <div className={ClassName.objectTag}>
          {relatedNum} {t('general.related')}
        </div>
      )}
      {metaObject?.attachments?.length && showAttachments !== false ? (
        <HoverAttachment maxWidth={300} parentElement={containerRef.current} metaId={metaObject.id}>
          <div style={{ cursor: 'pointer' }} className={ClassName.objectTag}>
            {metaObject.attachments.length} {t('general.att')}
          </div>
        </HoverAttachment>
      ) : null}
      {metaObject?.tags?.map(i => <ObjectTag key={i} tag={i} hideAdd hideDelete hideSize square />)}
    </Content>
  )
}
