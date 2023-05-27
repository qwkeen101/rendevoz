import Actions from '@/core/Actions'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { CSSProperties, ReactNode, memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Content, Icon, IconWithPopover, Image } from '@/components'
import { Editor } from '../editor/Editor'
import { PdfViewer } from '../pdf/PdfViewer'
import { ObjectActionPopover, TypeToTypeName } from './card/DatabaseCard'
import { ObjectTag, Whiteboard } from '@/core'
import DateFormat from '@/utils/dateFormat'
import getEmoji from '@/utils/emoji'
import FromRenderer from './FromRenderer'
import WebpageSourceRenderer from './WebpageSourceRenderer'
import Colors from '@/consts/colors'
import { TFunction } from 'i18next'
import { MetaObject, Size } from '~/typings'
import { GlobalImagePreviewerInstance } from '../global/GlobalImagePreviewer'

const clazzName = css([
  {
    cursor: 'pointer',
    fontWeight: 500,
    textTransform: 'none',
    ':hover': {
      textDecoration: 'underline'
    }
  },
  ClassName.ellipsisFont(2)
])

export const DefaultObjectTitleRenderClazzName = css([
  ClassName.title('16px'),
  {
    position: 'relative',
    width: 'fit-content',
    maxWidth: '100%',
    textDecoration: 'underline 1px rgba(0,0,0,0)',
    transition: 'text-decoration-color 0.3s ease',
    ':hover': {
      textDecorationColor: 'inherit'
    },
    cursor: 'pointer'
  }
])
const _renderTags = (
  {
    gap = 4,
    flexWrap = 'wrap',
    containerStyle,
    showCreatedAt,
    showUpdatedAt,
    showViewAt,
    containerClassName = css({
      '> *': {
        fontSize: '11px !important'
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
  },
  t: TFunction<'translation', undefined, 'translation'>,
  relatedNum: number,
  metaObject?: MetaObject
) => {
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
      {relatedNum > 0 && (
        <div style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
          {relatedNum} {t('general.related')}
        </div>
      )}
      {metaObject?.tags?.map(i => (
        <ObjectTag key={i} tag={i} hideAdd hideDelete hideSize small />
      ))}
    </Content>
  )
}
const _renderTitle = (
  {
    ellipsisLine = 2,
    titleClassName = css([ellipsisLine ? ClassName.ellipsisFont(ellipsisLine) : undefined, DefaultObjectTitleRenderClazzName]),
    onTitleClick,
    style
  }: {
    titleClassName?: string
    onTitleClick?: React.MouseEventHandler
    style?: CSSProperties
    ellipsisLine?: number
  },
  metaObject?: MetaObject
) => {
  return (
    <>
      {metaObject?.type === 'webpage' && metaObject.objectId && <WebpageSourceRenderer objectId={metaObject.objectId} />}
      <div onClick={onTitleClick} style={{ color: metaObject?.color, ...style, textTransform: 'none' }} className={titleClassName}>
        {metaObject?.name}
      </div>
    </>
  )
}
const _renderDescription = (
  {
    ellipsisLine = 4,
    descriptionClassName = css([ClassName.description('1rem'), ellipsisLine ? ClassName.ellipsisFont(ellipsisLine) : undefined]),
    style
  }: {
    descriptionClassName?: string
    style?: CSSProperties
    ellipsisLine?: number
  },
  metaObject?: MetaObject
) => {
  if (metaObject?.description) {
    return (
      <div className={descriptionClassName} style={{ ...style, textTransform: 'none' }}>
        {metaObject?.description}
      </div>
    )
  }
}

const _renderImage = (
  {
    width = 50,
    height = 50,
    ratio = 1,
    borderRadius = 4,
    style,
    minWidth,
    renderMode = 'thumbnail'
  }: Size & {
    ratio?: number
    minWidth?: number
    borderRadius?: number
    style?: CSSProperties
    renderMode?: 'thumbnail' | 'whole'
  },
  metaObject?: MetaObject,
  onSizeChange?: (size: Size) => void
) => {
  if (metaObject?.coverImgSrc) {
    return (
      <Image
        preview
        draggable={false}
        minWidth={minWidth}
        style={{
          borderRadius,
          flexShrink: 0,
          ...style
        }}
        onLoad={e => {
          const img = e.currentTarget
          onSizeChange?.({
            width: img.naturalWidth,
            height: img.naturalHeight
          })
        }}
        className={css({ margin: 'auto 0' })}
        src={metaObject.coverImgSrc}
        width={width}
        height={height}
        ratio={ratio}
      />
    )
  }
}
const _renderFrom = (
  { style, className, onFromClick }: { style?: CSSProperties; className?: string; onFromClick?: () => void },
  metaObject?: MetaObject
) => {
  return <FromRenderer style={style} metaObject={metaObject} onFromClick={onFromClick} />
}

const _renderOptions = (
  {
    iconName = 'park-more',
    style,
    customNode
  }: {
    customNode?: ReactNode
    style?: CSSProperties
    iconName?: string
  },
  metaObject?: MetaObject
) => {
  return (
    metaObject && (
      <IconWithPopover
        containerStyle={{
          position: 'absolute',
          top: 6,
          right: 10,
          zIndex: 10,
          ...style
        }}
        closeOnContentClick
        placement={['right', 'left']}
        align="start"
        padding={0}
        name={iconName}
        className={ClassName.circleButton(2)}
        disableIntersection
        content={customNode || <ObjectActionPopover metaObjectId={metaObject.id} />}
      ></IconWithPopover>
    )
  )
}

const defaultRenderWholeOptions = {
  columnGap: 3,
  rowGap: 10,
  renderOptions: {
    renderFrom: false,
    renderImage: true,
    renderOption: false
  }
}

const useRenderObject = (options: { metaObjectId: number }) => {
  const { metaObjectId } = options
  const { metaObjectAtom, relatedSetAtom } = useMemo(() => {
    const metaObjectAtom = selectAtom(metaObjectsAtom, m => m.get(metaObjectId))
    const relatedSetAtom = selectAtom(relatedMetaObjectsMapAtom, m => m.get(metaObjectId))
    return {
      metaObjectAtom,
      relatedSetAtom
    }
  }, [metaObjectId])

  const metaObject = useGlobalAtomValue(metaObjectAtom)
  const relatedSet = useGlobalAtomValue(relatedSetAtom)

  const uniqueId = useMemo(() => Id.getStrId(), [])

  const { t } = useTranslation()

  const renderTags = (options: Parameters<typeof _renderTags>[0]) => _renderTags(options, t, relatedSet?.size || 0, metaObject)

  const renderTitle = (options: Parameters<typeof _renderTitle>[0]) =>
    _renderTitle({ ...options, onTitleClick: options.onTitleClick || (() => Actions.navigateToTargetObject(metaObjectId)) }, metaObject)

  const renderDescription = (options: Parameters<typeof _renderDescription>[0]) => _renderDescription(options, metaObject)

  const renderImage = (options: Parameters<typeof _renderImage>[0]) => _renderImage(options, metaObject)

  const renderWhole = (options: Parameters<typeof WholeRenderer>[0]['options'] = defaultRenderWholeOptions) => (
    <WholeRenderer options={options} metaObject={metaObject} relatedNum={relatedSet?.size} />
  )

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

  const renderFrom = (options: Parameters<typeof _renderFrom>[0]) => _renderFrom(options, metaObject)

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

  const renderPopover = ({
    icon = 'park-more',
    position = 'left',
    align = 'center',
    ...rest
  }: { icon?: string; position?: 'left' | 'top' | 'right' | 'bottom'; align?: 'start' | 'center' | 'end' } & Partial<
    Parameters<typeof ObjectActionPopover>[0]
  >) => {
    return (
      <IconWithPopover
        content={<ObjectActionPopover {...rest} metaObjectId={metaObjectId} />}
        name={icon}
        align={align}
        placement={[position]}
      ></IconWithPopover>
    )
  }

  const renderInline = ({ containerStyle }: { containerStyle?: CSSProperties }) => {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', ...containerStyle }}>
        <div
          style={{
            borderRadius: '50%',
            width: '1em',
            height: '1em',
            background: Colors.Background.Light,
            border: `0.3em solid #6d6d6d`,
            margin: 'auto',
            flexShrink: 0,
            padding: 3
          }}
        ></div>
        <span
          data-meta
          onClick={() => {
            metaObject?.id && Actions.navigateToTargetObject(metaObject?.id)
          }}
          className={clazzName}
          style={{
            color: metaObject?.color
          }}
        >
          {metaObject?.name || 'Deleted Object'}
        </span>
        <div
          style={{
            textTransform: 'capitalize',
            pointerEvents: 'none',
            fontSize: 10,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            padding: '3px 8px',
            margin: 'auto'
          }}
          className={ClassName.objectTag}
        >
          {t(`general.${TypeToTypeName[metaObject?.type || 'normal']}`)}
        </div>
      </div>
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
    renderColumnImageWhole,
    renderPopover,
    renderInline
  }
}

const WholeRenderer = memo(
  ({
    options,
    metaObject,
    relatedNum = 0
  }: {
    options: {
      columnGap?: number
      rowGap?: number
      containerClassName?: string
      containerStyle?: CSSProperties
      containerOnClick?: React.MouseEventHandler
      mainContainerStyle?: CSSProperties
      tagsOptions?: Parameters<typeof _renderTags>[0]
      titleOptions?: Parameters<typeof _renderTitle>[0]
      imageOptions?: Parameters<typeof _renderImage>[0]
      fromOptions?: Parameters<typeof _renderFrom>[0]
      optionOptions?: Parameters<typeof _renderOptions>[0]
      descriptionOptions?: Parameters<typeof _renderDescription>[0]
      renderOptions: {
        renderImage?: boolean
        renderTitle?: boolean
        renderTags?: boolean
        renderDescription?: boolean
        renderFrom?: boolean
        renderOption?: boolean
        imageMode?: 'thumbnail' | 'whole'
      }
    }
    metaObject?: MetaObject
    relatedNum?: number
  }) => {
    const {
      renderOptions,
      columnGap,
      rowGap = 10,
      titleOptions = {},
      descriptionOptions = {},
      tagsOptions = {},
      imageOptions = {},
      fromOptions = {},
      optionOptions = {},
      containerClassName,
      containerStyle,
      containerOnClick,
      mainContainerStyle
    } = options
    const { t } = useTranslation()
    const [imgDisplayFlexMode, setImgDisplayFlexMode] = useState<CSSProperties['flexDirection']>('row')
    const [imgSize, setImgSize] = useState<{
      width?: number | string
      height?: number | string
      ratio?: number | string
      minWidth?: number
    }>(
      renderOptions.imageMode === 'whole'
        ? { width: '100%', ratio: 0.5625, minWidth: 320 }
        : {
            width: 50,
            height: 50,
            ratio: 1
          }
    )
    if (!metaObject || metaObject.deleted) return null
    return metaObject?.coverImgSrc && renderOptions.renderImage !== false ? (
      <Content
        flex
        alignItems="stretch"
        gap={rowGap}
        className={containerClassName}
        style={{
          ...containerStyle,
          flexDirection: imgDisplayFlexMode,
          padding: renderOptions.imageMode === 'whole' ? 0 : containerStyle?.padding,
          alignItems: imgDisplayFlexMode === 'row-reverse' && renderOptions.imageMode === 'whole' ? 'stretch' : undefined
        }}
      >
        {_renderImage({ ...imgSize, ...imageOptions, renderMode: renderOptions.imageMode }, metaObject, size => {
          if (renderOptions.imageMode === 'whole') {
            setImgDisplayFlexMode('column')
            // if (size.height > size.width) {
            //   setImgDisplayFlexMode('row-reverse')
            //   setImgSize({
            //     width: 'auto',
            //     ratio: 1.777,
            //     minWidth: 180,
            //     height: 'unset'
            //   })
            // } else {
            //   setImgSize({
            //     height: 'auto',
            //     ratio: 0.5625,
            //     width: '100%',
            //     minWidth: 320
            //   })
            //   setImgDisplayFlexMode('column')
            // }
          }
        })}
        <Content onClick={containerOnClick} style={mainContainerStyle} flex column gap={columnGap} justifyContent="center">
          {renderOptions.renderOption && _renderOptions(optionOptions, metaObject)}
          {renderOptions?.renderTags !== false &&
            _renderTags(
              {
                ...tagsOptions,
                containerStyle: { ...tagsOptions.containerStyle, paddingRight: renderOptions.renderOption ? '40px' : undefined }
              },
              t,
              relatedNum,
              metaObject
            )}
          {renderOptions?.renderTitle !== false &&
            _renderTitle(
              {
                ...titleOptions,
                onTitleClick:
                  titleOptions.onTitleClick ||
                  (() => {
                    Actions.navigateToTargetObject(metaObject.id)
                  })
              },
              metaObject
            )}
          {renderOptions?.renderDescription !== false && _renderDescription(descriptionOptions, metaObject)}
          {renderOptions?.renderFrom !== false && _renderFrom(fromOptions, metaObject)}
        </Content>
      </Content>
    ) : (
      <Content
        onClick={containerOnClick}
        flex
        column
        gap={columnGap}
        className={containerClassName}
        style={{ ...containerStyle, ...mainContainerStyle }}
      >
        {renderOptions?.renderOption && _renderOptions(optionOptions, metaObject)}
        {renderOptions?.renderTags !== false &&
          _renderTags(
            {
              ...tagsOptions,
              containerStyle: { ...tagsOptions.containerStyle, paddingRight: renderOptions.renderOption ? '40px' : undefined }
            },
            t,
            relatedNum,
            metaObject
          )}
        {renderOptions?.renderTitle !== false &&
          _renderTitle(
            {
              ...titleOptions,
              onTitleClick:
                titleOptions.onTitleClick ||
                (() => {
                  metaObject && Actions.navigateToTargetObject(metaObject.id)
                })
            },
            metaObject
          )}
        {renderOptions?.renderDescription !== false && _renderDescription(descriptionOptions, metaObject)}
        {renderOptions?.renderFrom !== false && _renderFrom(fromOptions, metaObject)}
      </Content>
    )
  }
)
export default useRenderObject
