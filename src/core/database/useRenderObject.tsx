import { useGlobalAtomValue, useSelectGlobalAtomValue } from '@/hooks/jotai'
import { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { CSSProperties, memo, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Content, Icon, IconWithPopover, Image, WithBorder } from '@/components'
import { Editor } from '../editor/Editor'
import { PdfViewer } from '../pdf/PdfViewer'
import { ObjectActionPopover, TypeToTypeName } from './card/DatabaseCard'
import { ObjectTag, SettingAtom, useRenderLabel, Whiteboard } from '@/core'
import DateFormat from '@/utils/dateFormat'
import FromRenderer from './FromRenderer'
import WebpageSourceRenderer from './WebpageSourceRenderer'
import Colors from '@/consts/colors'
import { TFunction } from 'i18next'
import { MetaObject, Size } from '~/typings'
import { Rendevoz } from '../rendevoz'
import HoverAttachment from './HoverAttachment'
import HoverObjectDetails from './HoverObjectDetails'
import { useUpdate } from 'react-use'
import Pdf from '@/core/pdf'
import BorderInput from '@/components/base/BorderInput'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { MetaStore, ObjectStore } from '@/stores'
import FontSize from '@/consts/font'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { toast } from 'react-hot-toast'

const clazzName = css({
  cursor: 'pointer',
  fontWeight: 500,
  textTransform: 'none',
  ':hover': {
    textDecoration: 'underline'
  }
})

export const keyboard = {
  ctrl: false
}
window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) {
      keyboard.ctrl = true
    }
  })
  document.addEventListener('keyup', e => {
    keyboard.ctrl = false
  })
})
export const DefaultObjectTitleRenderClazzName = css([
  ClassName.title('1rem'),
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
const TagRenderer = ({
  gap = 4,
  flexWrap = 'wrap',
  containerStyle,
  showCreatedAt,
  showUpdatedAt,
  showViewAt,
  showAttachments,
  containerClassName = css({
    '> *': {
      fontSize: '11px !important',
      lineHeight: '1.5 !important'
    }
  }),
  relatedNum,
  metaObject,
  t
}: {
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const update = useUpdate()
  useEffect(() => {
    if (metaObject?.attachments?.length) {
      update()
    }
  }, [])
  return (
    <Content
      flex
      ref={containerRef}
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
          {t('general.ago', {
            time: DateFormat.formatDistanceToNowStrict(metaObject?.createdAt)
          })}
        </Content>
      )}
      {showViewAt && metaObject?.viewAt && (
        <Content flex gap={4} style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
          <Icon name="park-preview-open" />
          {t('general.ago', {
            time: DateFormat.formatDistanceToNowStrict(metaObject?.viewAt)
          })}
        </Content>
      )}
      {showUpdatedAt && metaObject?.updatedAt && (
        <Content flex gap={4} style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
          <Icon name="park-edit" />

          {t('general.ago', {
            time: DateFormat.formatDistanceToNowStrict(metaObject?.updatedAt)
          })}
        </Content>
      )}
      {relatedNum > 0 && (
        <div style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
          {relatedNum} {t('general.related')}
        </div>
      )}
      {metaObject?.attachments?.length && showAttachments !== false ? (
        <HoverAttachment maxWidth={300} parentElement={containerRef.current} metaId={metaObject.id}>
          <div style={{ textTransform: 'capitalize', cursor: 'pointer' }} className={ClassName.objectTag}>
            {metaObject.attachments.length} {t('general.att')}
          </div>
        </HoverAttachment>
      ) : null}
      {metaObject?.tags?.map(i => <ObjectTag key={i} tag={i} hideAdd hideDelete hideSize square />)}
    </Content>
  )
}

const TitleRenderer = ({
  ellipsisLine = 2,
  titleClassName = css([ellipsisLine ? ClassName.ellipsisFont(ellipsisLine) : undefined, DefaultObjectTitleRenderClazzName]),
  onTitleClick,
  style,
  renderWebpageFrom = true,
  metaObject
}: {
  titleClassName?: string
  onTitleClick?: React.MouseEventHandler
  style?: CSSProperties
  ellipsisLine?: number
  renderWebpageFrom?: boolean
  metaObject?: MetaObject
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const { t } = useTranslation()
  return (
    <>
      {metaObject?.type === 'webpage' && renderWebpageFrom && metaObject.objectId && (
        <WebpageSourceRenderer objectId={metaObject.objectId} />
      )}
      {isEditing ? (
        <div
          style={{
            margin: '6px 0px',
            border: `1px solid ${Colors.Background.Border}`,
            background: 'transparent',
            borderRadius: 6,
            width: '100%',
            position: 'relative'
          }}
        >
          <AutosizeTextarea
            onKeyDownCapture={e => {
              e.stopPropagation()
              if (isHotkey(KEY.Tab, e)) {
                e.preventDefault()
                const t = e.currentTarget
                const start = t.selectionStart
                const end = t.selectionEnd

                // set textarea value to: text before caret + tab + text after caret
                t.value = t.value.substring(0, start) + '  ' + t.value.substring(end)

                // put caret at right position again
                t.selectionStart = t.selectionEnd = start + 2
              }
              if (isHotkey(KEY.Escape, e)) {
                setIsEditing(false)
              }
            }}
            style={{
              padding: '6px 8px',
              fontSize: FontSize['13px'],
              background: 'transparent',
              width: '100%',
              border: 'none',
              outline: 'none'
            }}
            className={css({
              '::-webkit-resizer': {
                background: 'transparent'
              }
            })}
            spellCheck="false"
            defaultValue={metaObject?.name}
            minRows={2}
            maxRows={9999}
            placeholder="Input new name"
          />
          <div
            onClick={e => {
              const v = e.currentTarget.previousElementSibling?.value
              if (v !== undefined && metaObject) {
                MetaStore.updateMetaObject({ id: metaObject.id, name: v }, true)
              }
              setIsEditing(false)
            }}
            className={ClassName.description(FontSize['12px'])}
            style={{ position: 'absolute', right: 10, bottom: 3, cursor: 'pointer' }}
          >
            {t('general.Confirm')}
          </div>
        </div>
      ) : (
        <div
          onContextMenu={() => setIsEditing(!isEditing)}
          onClick={e => {
            if (keyboard.ctrl && metaObject) {
              const link = `rendevoz://object/${metaObject?.id}`
              navigator.clipboard.writeText(link)
              toast.success(
                <Content className={ClassName.description()}>
                  <div style={{ textTransform: 'none' }}>{t('general.link is generated for this object')}!</div>
                  <div style={{ userSelect: 'all', textTransform: 'none' }}>{link}</div>
                </Content>
              )
            } else {
              onTitleClick?.(e)
            }
          }}
          style={{ color: metaObject?.color, ...style, textTransform: 'none' }}
          className={titleClassName}
        >
          {metaObject?.name}
        </div>
      )}
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
    minWidth
  }: Size & {
    ratio?: number
    minWidth?: number
    borderRadius?: number
    style?: CSSProperties
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
    customNode,
    renderOnParent,
    onClickOutside,
    zIndex
  }: {
    customNode?: ReactNode
    style?: CSSProperties
    iconName?: string
    renderOnParent?: boolean
    zIndex?: number
    onClickOutside?: (e: MouseEvent, setVisible: React.Dispatch<React.SetStateAction<boolean>>) => void
  },
  metaObject?: MetaObject
) => {
  return (
    metaObject && (
      <IconWithPopover
        renderOnParent={renderOnParent}
        containerStyle={{
          position: 'absolute',
          top: 0,
          right: 10,
          zIndex: 10,
          ...style
        }}
        onClickOutside={onClickOutside}
        closeOnContentClick
        placement={['right', 'left']}
        align="start"
        zIndex={zIndex}
        padding={0}
        name={iconName}
        className={ClassName.circleButton(2)}
        disableIntersection
        content={
          customNode || (
            <WithBorder>
              <ObjectActionPopover metaObjectId={metaObject.id} />
            </WithBorder>
          )
        }
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

  const renderTags = (options: Parameters<typeof TagRenderer>[0]) => (
    <TagRenderer {...options} relatedNum={relatedSet?.size || 0} metaObject={metaObject} t={t} />
  )

  const renderTitle = (options: Parameters<typeof TitleRenderer>[0]) => (
    <TitleRenderer
      {...options}
      onTitleClick={options.onTitleClick || (() => Rendevoz.Actions.Open.Meta.openMetaObject(metaObjectId))}
      metaObject={metaObject}
    />
  )

  const renderDescription = (options: Parameters<typeof _renderDescription>[0]) => _renderDescription(options, metaObject)

  const renderWhole = (options: Parameters<typeof WholeRenderer>[0]['options'] = defaultRenderWholeOptions) => (
    <WholeRenderer options={options} metaObject={metaObject} relatedNum={relatedSet?.size} />
  )

  const renderExpand = ({ editorTitleStyle = { padding: '20px 10px 10px 50px' } }: { editorTitleStyle?: CSSProperties }) => {
    if (!metaObject || !metaObject.objectId) return null
    const { objectId } = metaObject
    switch (metaObject?.type) {
      case 'pdf':
        return <Pdf pdfId={objectId} />
      case 'note':
        return <Editor type="note" titleStyle={editorTitleStyle} id={uniqueId} noteId={objectId} />
      case 'normal':
        return <Editor type="note" titleStyle={editorTitleStyle} id={uniqueId} noteId={objectId} />
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
  const renderOptions = (options: Parameters<typeof _renderOptions>[0]) => _renderOptions(options, metaObject)

  const renderPopover = ({
    icon = 'park-more',
    position = 'left',
    align = 'center',
    ...rest
  }: {
    icon?: string
    position?: 'left' | 'top' | 'right' | 'bottom'
    align?: 'start' | 'center' | 'end'
  } & Partial<Parameters<typeof ObjectActionPopover>[0]>) => {
    return (
      <IconWithPopover
        content={<ObjectActionPopover {...rest} metaObjectId={metaObjectId} />}
        name={icon}
        align={align}
        placement={[position]}
      ></IconWithPopover>
    )
  }

  const renderInline = (
    {
      containerStyle,
      ellipsisLine,
      showCircle,
      showUnderline,
      showHoverObjectDetails,
      renderAttOnParent,
      renderObjectDetailsOnParent
    }: {
      containerStyle?: CSSProperties
      ellipsisLine?: number
      showCircle?: boolean
      showUnderline?: boolean
      showHoverObjectDetails?: boolean
      renderAttOnParent?: boolean
      renderObjectDetailsOnParent?: boolean
    } = {
      ellipsisLine: 2,
      showCircle: true,
      showUnderline: true,
      showHoverObjectDetails: false,
      renderAttOnParent: false,
      renderObjectDetailsOnParent: true
    }
  ) => {
    const containerRef = useRef(null)
    const update = useUpdate()
    useEffect(() => {
      if (renderAttOnParent) {
        update()
      }
    }, [renderAttOnParent])
    return (
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'baseline',
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
            onClick={() => {
              if (showUnderline !== false) {
                metaObject?.id && Rendevoz.Actions.Open.Meta.openMetaObject(metaObject.id)
              }
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
          {t(`general.${TypeToTypeName[metaObject?.type || 'normal']}`)}
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
    renderInline,
    renderOptions
  }
}

const OriginText = memo(
  ({
    objectId,
    style,
    showEdit,
    ellipis,
    editorStyle,
    type,
    name
  }: {
    name: string
    objectId: number
    type: MetaObject['type']
    style?: CSSProperties
    showEdit?: boolean
    ellipis?: boolean
    editorStyle?: CSSProperties
  }) => {
    const { renderOriginalText, label } = useRenderLabel({ objectId: objectId, type })
    if (!label?.selectedText || label.selectedText === name) return null
    return renderOriginalText({
      text: label.selectedText,
      style,
      showEdit,
      ellipis,
      editorStyle
    })
  }
)
const noshrinkClass = css({
  '> *': {
    flexShrink: 0
  }
})

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
      tagAboveImage?: boolean
      containerStyle?: CSSProperties
      containerOnClick?: React.MouseEventHandler
      mainContainerStyle?: CSSProperties
      tagsOptions?: Parameters<typeof TagRenderer>[0]
      titleOptions?: Parameters<typeof TitleRenderer>[0]
      imageOptions?: Parameters<typeof _renderImage>[0]
      fromOptions?: Parameters<typeof _renderFrom>[0]
      originalTextOptions?: Omit<Parameters<typeof OriginText>[0], 'objectId'>
      optionOptions?: Parameters<typeof _renderOptions>[0]
      descriptionOptions?: Parameters<typeof _renderDescription>[0]
      renderOptions: {
        renderImage?: boolean
        renderTitle?: boolean
        renderTags?: boolean
        renderDescription?: boolean
        renderFrom?: boolean
        renderOption?: boolean
        renderOriginalText?: boolean
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
      originalTextOptions = {
        style: {
          margin: '4px 0px',
          padding: '2px 6px 4px'
        }
      },
      fromOptions = {},
      optionOptions = {},
      containerClassName,
      containerStyle,
      containerOnClick,
      mainContainerStyle,
      tagAboveImage = false
    } = options
    const { t } = useTranslation()
    const [imgDisplayFlexMode, setImgDisplayFlexMode] = useState<CSSProperties['flexDirection']>('row')
    const originalTextVisible = useSelectGlobalAtomValue(SettingAtom, s => s.label.showOriginalText)
    const [imgSize, setImgSize] = useState<{
      width?: number | string
      height?: number | string
      ratio?: number | string
      minWidth?: number
    }>(
      renderOptions.imageMode === 'whole'
        ? { width: '100%', ratio: 0.5625, minWidth: 280 }
        : {
            width: 50,
            height: 50,
            ratio: 1
          }
    )
    if (!metaObject || metaObject.deleted) return null
    return metaObject?.coverImgSrc && renderOptions.renderImage !== false ? (
      <>
        {tagAboveImage && (
          <TagRenderer
            {...tagsOptions}
            containerStyle={{
              ...tagsOptions.containerStyle,
              paddingRight: renderOptions.renderOption ? '40px' : undefined,
              marginBottom: 6
            }}
            relatedNum={relatedNum}
            metaObject={metaObject}
            t={t}
          />
        )}
        <Content
          flex
          alignItems="stretch"
          gap={rowGap}
          className={css([containerClassName, noshrinkClass])}
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
            }
          })}
          <Content onClick={containerOnClick} style={mainContainerStyle} flex column gap={columnGap} justifyContent="center">
            {renderOptions.renderOption && _renderOptions(optionOptions, metaObject)}
            {renderOptions?.renderTags !== false && !tagAboveImage && (
              <TagRenderer
                {...tagsOptions}
                containerStyle={{
                  ...tagsOptions.containerStyle,
                  paddingRight: renderOptions.renderOption ? '40px' : undefined
                }}
                relatedNum={relatedNum}
                metaObject={metaObject}
                t={t}
              />
            )}
            {renderOptions?.renderTitle !== false && (
              <TitleRenderer
                {...titleOptions}
                onTitleClick={
                  titleOptions.onTitleClick ||
                  (() => {
                    Rendevoz.Actions.Open.Meta.openMetaObject(metaObject.id)
                  })
                }
                metaObject={metaObject}
              />
            )}
            {renderOptions?.renderDescription !== false && _renderDescription(descriptionOptions, metaObject)}
            {originalTextVisible &&
              metaObject.type.includes('Label') &&
              renderOptions.renderOriginalText !== false &&
              metaObject.objectId && (
                <OriginText {...originalTextOptions} name={metaObject.name} type={metaObject.type} objectId={metaObject.objectId} />
              )}
            {renderOptions?.renderFrom !== false && _renderFrom(fromOptions, metaObject)}
          </Content>
        </Content>
      </>
    ) : (
      <Content
        onClick={containerOnClick}
        flex
        column
        gap={columnGap}
        className={css([containerClassName, noshrinkClass])}
        style={{ ...containerStyle, ...mainContainerStyle }}
      >
        {renderOptions?.renderOption && _renderOptions(optionOptions, metaObject)}
        {renderOptions?.renderTags !== false && (
          <TagRenderer
            {...tagsOptions}
            containerStyle={{
              ...tagsOptions.containerStyle,
              paddingRight: renderOptions.renderOption ? '40px' : undefined
            }}
            relatedNum={relatedNum}
            metaObject={metaObject}
            t={t}
          />
        )}
        {renderOptions?.renderTitle !== false && (
          <TitleRenderer
            {...titleOptions}
            onTitleClick={
              titleOptions.onTitleClick ||
              (() => {
                metaObject && Rendevoz.Actions.Open.Meta.openMetaObject(metaObject.id)
              })
            }
            metaObject={metaObject}
          />
        )}
        {renderOptions?.renderDescription !== false && _renderDescription(descriptionOptions, metaObject)}
        {originalTextVisible && metaObject.type.includes('Label') && renderOptions.renderOriginalText !== false && metaObject.objectId && (
          <OriginText {...originalTextOptions} name={metaObject.name} type={metaObject.type} objectId={metaObject.objectId} />
        )}
        {renderOptions?.renderFrom !== false && _renderFrom(fromOptions, metaObject)}
      </Content>
    )
  }
)

export default useRenderObject
