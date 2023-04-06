import Actions from '@/core/Actions'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { CSSProperties, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Content, Icon, Image } from '@/components'
import { Editor } from '../editor/Editor'
import { PdfViewer } from '../pdf/PdfViewer'
import { TypeToTypeName } from './card/DatabaseCard'
import { ObjectTag, Whiteboard } from '@/core'
import DateFormat from '@/utils/dateFormat'
import getEmoji from '@/utils/emoji'
import { globalStore } from '@/stores'
import { atom } from 'jotai'
import { getIcon } from '@/components/layout/sidebar/items/SidebarObjectItem'

const useRenderObject = (options: { metaObjectId: number }) => {
  const { metaObjectId } = options
  const { metaObjectAtom, relatedSetAtom, fromAtom } = useMemo(() => {
    const metaObjectAtom = selectAtom(metaObjectsAtom, m => m.get(metaObjectId))
    const relatedSetAtom = selectAtom(relatedMetaObjectsMapAtom, m => m.get(metaObjectId))
    const meta = globalStore.get(metaObjectsAtom).get(metaObjectId)
    const fromAtom = meta?.from?.metaId ? selectAtom(metaObjectsAtom, m => m.get(meta.from?.metaId)) : atom(null)
    return {
      metaObjectAtom,
      fromAtom,
      relatedSetAtom
    }
  }, [metaObjectId])

  const metaObject = useGlobalAtomValue(metaObjectAtom)
  const relatedSet = useGlobalAtomValue(relatedSetAtom)
  const fromMeta = useGlobalAtomValue(fromAtom)
  const uniqueId = useMemo(() => Id.getStrId(), [])

  const { t } = useTranslation()
  const renderTags = ({
    gap = 4,
    flexWrap = 'wrap',
    containerStyle,
    showCreatedAt,
    showUpdatedAt,
    showViewAt,
    containerClassName = css({
      '> *': {
        fontSize: '10px !important'
      }
    })
  }: {
    gap?: number
    flexWrap?: CSSProperties['flexWrap']
    containerStyle?: CSSProperties
    containerClassName?: string
    showUpdatedAt?: boolean
    showCreatedAt?: boolean
    showViewAt?: boolean
    maxTagsToShow?: number
  }) => {
    return (
      <Content
        flex
        gap={gap}
        style={{
          flexWrap,
          fontFamily: 'Muli',
          ...containerStyle
        }}
        className={containerClassName}
      >
        <div style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
          {t(`general.${TypeToTypeName[metaObject?.type || 'normal']}`)}
        </div>
        {showCreatedAt && metaObject?.createdAt && (
          <Content flex gap={4} style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
            <Icon name="park-add-one" />
            {t('general.ago', { time: DateFormat.formatDistanceToNowStrict(metaObject?.createdAt) })}
          </Content>
        )}
        {showViewAt && metaObject?.viewAt && (
          <Content flex gap={4} style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
            <Icon name="park-preview-open" />
            {t('general.ago', { time: DateFormat.formatDistanceToNowStrict(metaObject?.viewAt) })}
          </Content>
        )}
        {showUpdatedAt && metaObject?.updatedAt && (
          <Content flex gap={4} style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
            <Icon name="park-edit" />

            {t('general.ago', { time: DateFormat.formatDistanceToNowStrict(metaObject?.updatedAt) })}
          </Content>
        )}
        {relatedSet && relatedSet?.size > 0 && (
          <div style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
            {relatedSet.size} {t('general.related')}
          </div>
        )}
        {metaObject?.tags?.map(i => (
          <ObjectTag key={i} tag={i} hideAdd hideDelete hideSize small />
        ))}
      </Content>
    )
  }

  const renderTitle = ({
    ellipsisLine,
    titleClassName = css([
      ellipsisLine ? ClassName.ellipsisFont(ellipsisLine) : undefined,
      ClassName.title('16px'),
      {
        position: 'relative',
        width: 'fit-content',
        textDecoration: 'underline 1px rgba(0,0,0,0)',
        transition: 'text-decoration-color 0.3s ease',
        ':hover': {
          textDecorationColor: 'rgba(0,0,0,0.8)'
        },
        cursor: 'pointer'
      }
    ]),
    onTitleClick = () => Actions.navigateToTargetObject(metaObjectId),
    style
  }: {
    titleClassName?: string
    onTitleClick?: React.MouseEventHandler
    style?: CSSProperties
    ellipsisLine?: number
  }) => {
    return (
      <div onClick={onTitleClick} style={style} className={titleClassName}>
        {metaObject?.name}
      </div>
    )
  }

  const renderDescription = ({
    ellipsisLine,
    descriptionClassName = css([ClassName.description('14px'), ellipsisLine ? ClassName.ellipsisFont(ellipsisLine) : undefined]),
    style
  }: {
    descriptionClassName?: string
    style?: CSSProperties
    ellipsisLine?: number
  }) => {
    if (metaObject?.description) {
      return (
        <div className={descriptionClassName} style={style}>
          {metaObject?.description}
        </div>
      )
    }
  }

  const renderImage = ({
    width = 40,
    height = 40,
    ratio = 1,
    borderRadius = 4,
    style
  }: {
    width?: number
    height?: number
    ratio?: number
    borderRadius?: number
    style?: CSSProperties
  }) => {
    if (metaObject?.coverImgSrc) {
      return (
        <Image
          draggable={false}
          style={{
            borderRadius,
            flexShrink: 0,
            ...style
          }}
          className={css({ margin: 'auto' })}
          src={metaObject.coverImgSrc || metaObject.from?.icon}
          width={width}
          height={height}
          ratio={ratio}
        />
      )
    }
    if (metaObject?.icon) {
      const emoji = getEmoji(metaObject.icon)
      if (!emoji) return
      return (
        <img
          src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
          style={{
            width: width / 1.5,
            height: height / 1.5,
            backgroundImage: `url(${emoji.imageSrc})`,
            backgroundPositionX: `${(emoji.x * 100) / 60}%`,
            backgroundPositionY: `${(emoji.y * 100) / 60}%`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '6100% 6100%',
            verticalAlign: '-0.1em',
            margin: 'auto'
          }}
        />
      )
    }
  }
  const renderWhole = ({
    columnGap = 3,
    rowGap = 10,
    titleOptions = {},
    descriptionOptions = {},
    tagsOptions = {},
    imageOptions = {},
    fromOptions = {},
    containerClassName,
    containerStyle,
    containerOnClick,
    renderOptions = {
      renderFrom: false,
      renderImage: true
    }
  }: {
    columnGap?: number
    rowGap?: number
    containerClassName?: string
    containerStyle?: CSSProperties
    containerOnClick?: React.MouseEventHandler
    tagsOptions?: Parameters<typeof renderTags>[0]
    titleOptions?: Parameters<typeof renderTitle>[0]
    imageOptions?: Parameters<typeof renderImage>[0]
    fromOptions?: Parameters<typeof renderFrom>[0]
    descriptionOptions?: Parameters<typeof renderDescription>[0]
    renderOptions?: {
      renderImage?: boolean
      renderTitle?: boolean
      renderTags?: boolean
      renderDescription?: boolean
      renderFrom?: boolean
    }
  }) => {
    return (metaObject?.coverImgSrc || metaObject?.icon) && renderOptions.renderImage !== false ? (
      <Content flex alignItems="stretch" gap={rowGap} className={containerClassName} style={containerStyle}>
        {renderImage(imageOptions)}
        <Content onClick={containerOnClick} flex column gap={columnGap} justifyContent="center">
          {renderOptions?.renderTags !== false && renderTags(tagsOptions)}
          {renderOptions?.renderTitle !== false && renderTitle(titleOptions)}
          {renderOptions?.renderDescription !== false && renderDescription(descriptionOptions)}
          {renderOptions?.renderFrom !== false && renderFrom(fromOptions)}
        </Content>
      </Content>
    ) : (
      <Content onClick={containerOnClick} flex column gap={columnGap} className={containerClassName} style={containerStyle}>
        {renderOptions?.renderTags !== false && renderTags(tagsOptions)}
        {renderOptions?.renderTitle !== false && renderTitle(titleOptions)}
        {renderOptions?.renderDescription !== false && renderDescription(descriptionOptions)}
        {renderOptions?.renderFrom !== false && renderFrom(fromOptions)}
      </Content>
    )
  }
  const renderExpand = ({ editorTitleStyle = { padding: '20px 10px 10px 50px' } }: { editorTitleStyle?: CSSProperties }) => {
    if (!metaObject || !metaObject.objectId) return null
    const { objectId } = metaObject
    switch (metaObject?.type) {
      case 'pdf':
        return <PdfViewer documentId={objectId} />
      case 'note':
        return <Editor titleStyle={editorTitleStyle} id={uniqueId} noteId={objectId} />
      case 'normal':
        return <Editor titleStyle={editorTitleStyle} id={uniqueId} noteId={objectId} />
      case 'whiteboard':
        return <Whiteboard enableMiniMap={false} whiteboardId={objectId} />
    }
    return null
  }
  const renderFrom = ({
    containerStyle,
    style,
    className
  }: {
    containerStyle?: CSSProperties
    style?: CSSProperties
    className?: string
  }) => {
    if (fromMeta) {
      const icon = getIcon(fromMeta.type)
      return (
        <Content flex gap={10} style={{ margin: '2px 0px 2px', ...containerStyle }} alignItems="center">
          {icon && <Icon size={14} name={icon} />}
          <div
            style={{
              color: '#616c77',
              fontSize: '0.8rem',
              textTransform: 'none',
              ...style
            }}
            className={className}
          >
            {fromMeta.name}
          </div>
        </Content>
      )
    }
    if (metaObject?.from) {
      const { icon, name } = metaObject.from
      return (
        <Content flex gap={10} style={{ margin: '2px 0px 2px', ...containerStyle }} alignItems="center">
          {icon && (icon.startsWith('park') ? <Icon size={14} name={icon} /> : <Image src={icon} width={14} />)}
          <div
            style={{
              color: '#616c77',
              fontSize: '0.8rem',
              textTransform: 'none',
              ...style
            }}
            className={className}
          >
            {name}
          </div>
        </Content>
      )
    }
    return null
  }

  const renderColumnImageWhole = (options?: Parameters<typeof renderWhole>[0]) => {
    if (!metaObject?.coverImgSrc) return renderWhole(options)
    return (
      <Content flex column fullHeight fullWidth>
        <img
          className={css({
            width: '100%',
            height: '100%',
            position: 'absolute',
            objectFit: 'cover',
            inset: 0
          })}
          src={metaObject?.coverImgSrc}
        />
        <Content>
          {renderWhole({
            ...options,
            containerClassName: ClassName.Background.pseudoBlubBackground,
            renderOptions: {
              ...options?.renderOptions,
              renderImage: false
            }
          })}
        </Content>
      </Content>
    )
  }
  return {
    renderTitle,
    renderTags,
    renderDescription,
    renderWhole,
    metaObject,
    renderExpand,
    renderFrom,
    renderColumnImageWhole
  }
}

export default useRenderObject
