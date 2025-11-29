// for whiteboard
import { MetaStore, ObjectStore } from '@/api/stores'
import { Icon, AutosizeTextarea, Markdown } from '@/components'
import { CSSProperties, memo, ReactElement, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { Colors, Icons, KEY } from '@/consts'
import { useTranslation } from 'react-i18next'
import Video from '@/core/components/media/wrappers/Video'
import Audio from '@/core/components/media/wrappers/Audio'
import classnames from 'classnames'
import { LabelDetailsContext } from '@/core/object/renderer/LabelDetailsContext'
import { css } from '@emotion/css'
import UseRenderLabel from '@/core/object/renderer/useRenderLabel'
import isHotkey from 'is-hotkey'
import VideoLabelVideoPreviewer from '@/core/object/renderer/VideoLabelVideoPreviewer'
import { IVideoLabel } from '~/typings'

const firstChildPaddingTop = css({
  ':first-child': {
    paddingTop: '6px !important'
  }
})

export default memo(
  ({
    metaId,
    style,
    showImage,
    showVideo,
    showAddNote = true,
    autoPlay,
    showAudio,
    imageStyle,
    showQuestion = true,
    sourceStyle,
    textStyle,
    noteStyle,
    collapseOriginalText,
    disableSidebar
  }: {
    metaId: number
    style?: CSSProperties
    showImage?: boolean
    showAddNote?: boolean
    showVideo?: boolean
    showAudio?: boolean
    showQuestion?: boolean
    autoPlay?: boolean
    noteStyle?: CSSProperties
    textStyle?: CSSProperties
    sourceStyle?: CSSProperties | ((hasDisplayer: boolean) => CSSProperties)
    imageStyle?: CSSProperties
    collapseOriginalText?: boolean
    disableSidebar?: boolean
  }) => {
    const context = useContext(LabelDetailsContext)
    const sidebarMode = disableSidebar ? false : context.sidebarMode
    const metaObject = MetaStore.useValue(metaId)
    const { t } = useTranslation()
    const { label, renderQuestions } = UseRenderLabel({
      type: metaObject?.type,
      objectId: metaObject?.objectId
    })
    const from = useMemo(() => {
      if (metaObject?.fromObject) {
        return {
          name: MetaStore.getMetaObjectsMap().get(metaObject.fromObject.metaId)?.name,
          icon: Global.utils.getIcon(metaObject.fromObject.type)
        }
      }
    }, [metaObject?.fromObject])

    const inputRef = useRef<HTMLDivElement>(null)
    const [showToolbar, setShowToolbar] = useState(false)
    const noteVisible = !((showAddNote === false || context.showAddNote === false) && !metaObject?.name)
    const [isEditing, setIsEditing] = useState(false)

    useLayoutEffect(() => {
      if (inputRef.current && metaObject) {
        inputRef.current.innerText = metaObject.name || ''
        if (isEditing) {
          inputRef.current.focus()
        }
      }
    }, [metaObject?.name, noteVisible, isEditing])
    const [displayer, setDisplayer] = useState<ReactElement>()
    const renderImgOrLabel = async () => {
      if (!label) return undefined
      if (showImage === false) return null
      if (metaObject?.type === 'videoLabel' && showVideo !== false) {
        setDisplayer(
          <VideoLabelVideoPreviewer
            style={{
              borderRadius: sidebarMode ? '0.75rem' : imageStyle?.borderRadius,
              ...imageStyle
            }}
            label={label as IVideoLabel}
            cover={metaObject.coverImgSrc}
          />
        )
        return
      }
      if (metaObject?.type === 'audioLabel' && showAudio !== false) {
        const audioId = label.parentObjectId
        if (audioId) {
          const v = await ObjectStore('audio').getOneById(audioId)
          if (v) {
            console.log(v)
            setDisplayer(
              <Audio
                onlyCore
                mediaState={{
                  toolbar: {
                    toolbarEnabled: false
                  },
                  styles: {
                    playerHeaderClassName: '!p-4 !pb-2 border-bottom !flex-col !items-start',
                    playerHeaderNameContainerClassName: '!items-start',
                    playerHeaderBottomBarClassName: '!mx-0',
                    playerStyle: {
                      borderBottom: Colors.Consts.Border
                    },
                    controlBarStyle: {
                      height: 'auto',
                      marginTop: 8
                    },
                    titleStyle: {
                      fontSize: 14
                    }
                  },
                  layout: {
                    audioHeaderMode: true,
                    smallAudioThumbnail: true,
                    audioPodcast: false
                  },
                  url: v.url,
                  currentTime: label.time
                }}
              />
            )
            return
          }
        }
      }
      if (metaObject?.coverImgSrc) {
        setDisplayer(
          <img
            style={{
              aspectRatio: metaObject?.type === 'videoLabel' ? '16 / 9' : undefined,
              objectFit: metaObject?.type === 'videoLabel' ? 'cover' : 'contain',
              borderRadius: sidebarMode ? '0.75rem' : imageStyle?.borderRadius,
              ...imageStyle
            }}
            src={metaObject.coverImgSrc}
            width={'100%'}
          />
        )
        return
      }
      setDisplayer(undefined)
    }
    useMemo(() => {
      renderImgOrLabel()
    }, [metaObject, label, showVideo, showAudio, imageStyle?.objectFit, sidebarMode])
    const selectedTextVisible = label?.selectedText && !label.imageUrl && metaObject
    const padding = '8px'
    const largePadding = '8px'
    return (
      <div
        contentEditable={false}
        onPointerLeave={() => setShowToolbar(false)}
        onPointerEnter={() => {
          setShowToolbar(true)
        }}
        className={'flex flex-col w-full'}
        style={{
          ...style,
          overflowY: sidebarMode ? undefined : 'auto',
          margin: sidebarMode ? 'auto' : undefined,
          maxHeight: sidebarMode ? undefined : '100%',
          padding: sidebarMode ? '1.5rem' : undefined,
          maxWidth: sidebarMode ? '720px' : style?.maxWidth
        }}
        onPointerMove={() => !showToolbar && setShowToolbar(true)}
      >
        {displayer}
        {context.showSource !== false && (
          <div
            className={'em:text-sm items-center flex justify-between gap-2'}
            style={{
              padding,
              ...(typeof sourceStyle === 'function' ? sourceStyle(!!displayer) : sourceStyle)
            }}
          >
            {from && (
              <div onClick={() => Global.layoutOps?.openObject(metaId)} className={'items-center cursor-pointer flex-1 gap-2 flex'}>
                <Icon name={from.icon} />
                <div className={'line-clamp-1'}>{from.name || t('general.Unnamed')}</div>
              </div>
            )}
            {(showToolbar || isEditing) && (
              <>
                {metaObject?.name && (
                  <Icon
                    onPointerDown={e => e.preventDefault()}
                    name={Icons.Edit}
                    className={classnames('cursor-pointer mr-1.5', isEditing && 'select-color-font')}
                    onClick={() => {
                      setIsEditing(!isEditing)
                      inputRef.current?.blur()
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
        {selectedTextVisible && (
          <AutosizeTextarea
            value={label.selectedText}
            onBlur={e => {
              ObjectStore(label.specType).updateOne({
                id: label.id,
                selectedText: e.target.innerText
              })
              MetaStore.updateMetaObject({
                id: metaId,
                placeholderName: e.target.innerText || ''
              })
            }}
            className={classnames('transparent-font w-full shrink-0', collapseOriginalText && noteVisible && 'line-clamp-3')}
            style={{
              display: collapseOriginalText ? undefined : 'block',
              padding: '4px 8px',
              resize: 'none',
              borderLeft: `3px solid ${Colors.getAdaptColor(label.color) || 'var(--emphasis)'}`,
              ...textStyle
            }}
          ></AutosizeTextarea>
        )}
        {noteVisible ? (
          isEditing || !metaObject?.name ? (
            <AutosizeTextarea
              ref={inputRef}
              onBlur={e => {
                metaObject &&
                  MetaStore.updateMetaObject({
                    id: metaObject.id,
                    name: inputRef.current?.innerText || ''
                  })
                setIsEditing(false)
              }}
              style={{
                resize: 'none',
                display: 'block',
                flexShrink: 0,
                width: '100%',
                padding,
                paddingBottom: sidebarMode ? '3rem' : 8,
                ...noteStyle,
                paddingTop: !selectedTextVisible ? 0 : 8
              }}
              onKeyDown={e => {
                if (isHotkey(KEY.Escape, e)) {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              className={firstChildPaddingTop}
              placeholder={t('general.Add note')}
            />
          ) : (
            metaObject?.name && (
              <div
                className={firstChildPaddingTop}
                style={{
                  padding,
                  ...noteStyle,
                  paddingTop: !selectedTextVisible ? 0 : 8,
                  whiteSpace: 'normal'
                }}
              >
                <Markdown>{metaObject?.name}</Markdown>
              </div>
            )
          )
        ) : null}
        {showQuestion &&
          renderQuestions({
            style: {
              padding: largePadding,
              borderTop: '1px solid var(--border-background)'
            }
          })}
      </div>
    )
  }
)
