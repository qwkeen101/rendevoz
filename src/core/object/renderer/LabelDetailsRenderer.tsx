// for whiteboard
import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon, Tooltip } from '@/components'
import { CSSProperties, memo, ReactElement, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ILabel, MetaObject } from '~/typings'
import AutosizeTextarea from '@/components/custom/input/AutoSizeTextArea'
import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import Video from '@/core/components/media/wrappers/Video'
import Audio from '@/core/components/media/wrappers/Audio'

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
    sourceStyle?: CSSProperties
    imageStyle?: CSSProperties | ((m?: MetaObject) => CSSProperties)
  }) => {
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
                      fontSize: 15
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
              aspectRatio: '16 / 9',
              objectFit: 'cover',
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
    return (
      <Content
        contentEditable={false}
        onPointerLeave={() => setShowToolbar(false)}
        onPointerEnter={() => {
          setShowToolbar(true)
        }}
        style={{ ...style }}
        fullWidth
        onPointerMove={() => !showToolbar && setShowToolbar(true)}
      >
        {displayer}
        <Content
          flex
          alignItems={'center'}
          justifyContent={'space-between'}
          style={{
            padding: '8px 12px',
            ...sourceStyle
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
              <div className={ClassName.ellipsisFont(1)}>{from.name}</div>
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
              marginBottom: 8,
              display: 'block',
              padding: '4px 10px 4px 10px',
              resize: 'none',
              lineHeight: 1.57,
              borderLeft: `2px solid ${Colors.getAdaptColor(label.color) || 'var(--emphasis)'}`,
              background: Colors.Background.ButtonHover
            }}
          ></AutosizeTextarea>
        )}
        {showAddNote === false && !metaObject?.name ? null : (
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
            value={metaObject?.name}
            placeholder={t('general.Add note')}
            className={ClassName.noStyleInput}
          />
        )}
      </Content>
    )
  }
)
