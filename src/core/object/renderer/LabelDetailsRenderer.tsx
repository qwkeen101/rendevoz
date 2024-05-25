// for whiteboard
import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon, Tooltip } from '@/components'
import { CSSProperties, memo, ReactElement, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ILabel, MetaObject } from '~/typings'
import AutosizeTextarea from '@/components/custom/input/AutoSizeTextArea'
import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import Video from '@/core/components/media/wrappers/Video'
import Audio from '@/core/components/media/wrappers/Audio'
import classnames from 'classnames'
import { LabelDetailsContext } from '@/core/object/renderer/LabelDetailsContext'
import { css } from '@emotion/css'

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
    sourceStyle,
    textStyle,
    noteStyle
  }: {
    metaId: number
    style?: CSSProperties
    showImage?: boolean
    showAddNote?: boolean
    showVideo?: boolean
    showAudio?: boolean
    autoPlay?: boolean
    noteStyle?: CSSProperties
    textStyle?: CSSProperties
    sourceStyle?: CSSProperties | ((hasDisplayer: boolean) => CSSProperties)
    imageStyle?: CSSProperties | ((m?: MetaObject) => CSSProperties)
  }) => {
    const context = useContext(LabelDetailsContext)
    const metaObject = MetaStore.useValue(metaId)
    const { t } = useTranslation()
    const label = ObjectStore(metaObject?.type).useValue(metaObject?.objectId) as ILabel | undefined
    const from = useMemo(() => {
      if (metaObject?.fromObject) {
        return {
          name: MetaStore.getMetaObjectsMap().get(metaObject.fromObject.metaId)?.name,
          icon: Rendevoz.Utils.Object.getMetaObjectIcon(metaObject.fromObject.type)
        }
      }
    }, [metaObject?.fromObject])
    const normalizedTime = useMemo(() => {
      if (label?.time !== undefined) {
        return normalizeSecondsToTime(label.time)
      }
    }, [label?.time])
    const inputRef = useRef<HTMLDivElement>(null)
    const [showToolbar, setShowToolbar] = useState(false)
    useLayoutEffect(() => {
      if (inputRef.current && metaObject) {
        const v = inputRef.current.innerText
        if (v !== metaObject.name) {
          inputRef.current.innerText = metaObject.name || ''
        }
      }
    }, [metaObject?.name])
    const [displayer, setDisplayer] = useState<ReactElement>()
    const renderImgOrLabel = async () => {
      if (!label) return undefined
      if (showImage === false) return null
      if (metaObject?.type === 'videoLabel' && showVideo !== false) {
        const videoId = label.parentObjectId
        if (videoId) {
          const v = await ObjectStore('video').getOneById(videoId)
          if (v) {
            setDisplayer(
              <Video
                onlyCore
                mediaState={{
                  autoPlay,
                  url: v.url,
                  currentTime: label.time,
                  styles: {
                    videoBorderRadius: 0
                  }
                }}
              />
            )
            return
          }
        }
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
                    extra: false,
                    addLabel: false
                  },
                  styles: {
                    progressHeight: 8,
                    playerStyle: {
                      padding: '8px 12px',
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
                    showProgressPins: false,
                    showDescription: false,
                    showAudioThumbnail: false
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
        const s = typeof imageStyle === 'function' ? imageStyle(metaObject) : imageStyle
        setDisplayer(
          <img
            style={{
              aspectRatio: metaObject?.type === 'videoLabel' ? '16 / 9' : undefined,
              objectFit: metaObject?.type === 'videoLabel' ? 'cover' : 'contain',
              ...s
            }}
            src={metaObject.coverImgSrc}
            width={'100%'}
          />
        )
        return
      }
      setDisplayer(undefined)
    }
    useEffect(() => {
      renderImgOrLabel()
    }, [metaObject, label, showVideo, showAudio])
    const audioLabelMode = metaObject?.type === 'audioLabel' && showAudio
    const noteVisible = !((showAddNote === false || context.showAddNote === false) && !metaObject?.name)
    return (
      <Content
        contentEditable={false}
        onPointerLeave={() => setShowToolbar(false)}
        onPointerEnter={() => {
          setShowToolbar(true)
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}
        fullWidth
        className={'font-size-14'}
        onPointerMove={() => !showToolbar && setShowToolbar(true)}
      >
        {displayer}
        {!audioLabelMode && context.showSource !== false && (
          <Content
            flex
            alignItems={'center'}
            justifyContent={'space-between'}
            className={'font-size-13'}
            style={{
              padding: displayer ? '4px 12px 0px' : '6px 12px 0px',
              ...(typeof sourceStyle === 'function' ? sourceStyle(!!displayer) : sourceStyle)
            }}
            gap={6}
          >
            {from && (
              <Content
                flex
                gap={8}
                style={{
                  flex: 1
                }}
              >
                <Icon size={16} name={from.icon} />
                <div className={'ellipsis-font-1'}>{from.name || t('general.Unnamed')}</div>
                {normalizedTime && <div style={{ flexShrink: 0 }}> - {normalizedTime}</div>}
              </Content>
            )}
            {showToolbar && (
              <Content flex gap={4}>
                <Tooltip content={'View source'}>
                  <Icon
                    size={12}
                    onClick={() => {
                      Rendevoz.Actions.Open.Meta.openMetaObject(metaId)
                    }}
                    className={ClassName.flatButton(4, '2px')}
                    name={'park-share'}
                  />
                </Tooltip>
              </Content>
            )}
          </Content>
        )}
        {label?.selectedText && metaObject && (
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
            style={{
              width: '100%',
              display: 'block',
              padding: '4px 10px',
              resize: 'none',
              lineHeight: 1.57,
              borderLeft: `3px solid ${Colors.getAdaptColor(label.color) || 'var(--emphasis)'}`,
              ...textStyle
            }}
          ></AutosizeTextarea>
        )}
        {noteVisible ? (
          <AutosizeTextarea
            ref={inputRef}
            onBlur={e => {
              metaObject &&
                MetaStore.updateMetaObject({
                  id: metaObject.id,
                  name: e.target.innerText || ''
                })
            }}
            style={{
              resize: 'none',
              display: 'block',
              width: '100%',
              padding: '0px 12px 8px',
              lineHeight: 1.57,
              ...noteStyle
            }}
            className={firstChildPaddingTop}
            value={metaObject?.name}
            placeholder={t('general.Add note')}
          />
        ) : null}
      </Content>
    )
  }
)
