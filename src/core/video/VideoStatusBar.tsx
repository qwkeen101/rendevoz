import { Button, Content, Icon, IconWithPopover, Switch, WithBorder } from '@/components'
import useVideoState from './hooks/useVideoState'
import { MetaStore, ObjectStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { useState } from 'react'
import { AttachmentWrapper } from '../database'
import { Rendevoz } from '../rendevoz'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'
import useVideoSidebarState from './hooks/useVideoSidebarState'
import { css } from '@emotion/css'
import DateFormat from '@/utils/dateFormat'
import { useSetting } from '../setting'
import produce from 'immer'
import { toast } from 'react-hot-toast'
import { saveBlobLocally, saveFileLocally, saveImageLocally } from '@/utils'
import toWebVTT from 'srt-webvtt'
import { WebVTTParser } from 'webvtt-parser'
import Id from '@/utils/id'
import { useVideoInstance } from '@/core/video/hooks/useVideoInstance'
import { normalizeSecondsToTime } from '@/core/video/utils'

const VideoStatusBar = () => {
  const [videoState, setVideoState] = useVideoState()
  const videoMeta = videoState.videoId ? MetaStore.getMetaObjectByObjectId(videoState.videoId) : undefined
  const [barState, setBarState] = useState<{
    addingAttachment: boolean
  }>()
  const instance = useVideoInstance()
  const [sidebarState, setSidebarState] = useVideoSidebarState()
  const { t } = useTranslation()
  const [setting, setSetting] = useSetting()
  return (
    <Content flex column style={{ margin: '16px 0px' }}>
      <div style={{ width: '100%' }} className={css([ClassName.title(FontSize['18px']), ClassName.ellipsisFont(1)])}>
        {videoMeta?.name}
      </div>
      <Content flex justifyContent="space-between" alignItems="center" gap={10} className={ClassName.description(FontSize['12px'])}>
        <Content flex gap={18} style={{ flexGrow: 1, flexShrink: 0 }}>
          {videoMeta?.createdAt && <div>{DateFormat.formatDistanceToNowStrict(videoMeta?.createdAt, true)}</div>}
          {videoState.labels?.length ? (
            <Content flex gap={4}>
              <Icon size={14} name="park-pushpin" />
              {videoState.labels.length}
            </Content>
          ) : null}
        </Content>
        {videoState.subtitleUrl && sidebarState.showSubtitles === false && (
          <Button.IconButton
            icon="park-align-text-bottom-one"
            style={{ flexShrink: 0 }}
            onClick={() => {
              setSidebarState(s => ({ ...s, showSubtitles: true }))
            }}
            text={t('general.show subtitles')}
          ></Button.IconButton>
        )}
        {sidebarState.showChapters === false && (
          <Button.IconButton
            icon="park-link"
            style={{ flexShrink: 0 }}
            onClick={() => {
              setSidebarState(s => ({ ...s, showChapters: true }))
            }}
            text={t('general.show chapters')}
          ></Button.IconButton>
        )}
        {sidebarState.showLabels === false && (
          <Button.IconButton
            icon="park-label"
            style={{ flexShrink: 0 }}
            onClick={() => {
              setSidebarState(s => ({ ...s, showLabels: true }))
            }}
            text={t('general.show labels')}
          ></Button.IconButton>
        )}
        <Button.IconButton
          icon="park-edit"
          text={t('general.edit details')}
          style={{ flexShrink: 0 }}
          onClick={() => {
            videoMeta?.id && Rendevoz.Actions.Open.Meta.openEditMetaDialog(videoMeta?.id)
          }}
        ></Button.IconButton>
        {videoState.mode === 'web' && (
          <IconWithPopover
            padding={0}
            content={setState => (
              <WithBorder onClick={e => Rendevoz.Events.DOM.hasButton(e) && setState(false)} padding={8} style={{ borderRadius: 8 }}>
                <Button.IconButton
                  icon="park-down-picture"
                  text={t('general.Download screenshot')}
                  onClick={() => {
                    const videoMeta = videoState.videoId ? MetaStore.getMetaObjectByObjectId(videoState.videoId) : undefined
                    if (!videoMeta) return
                    instance.captureCurrentImage?.().then(res => {
                      if (res) {
                        const a = document.createElement('a')
                        a.href = res
                        a.download = `${videoMeta.name}_${normalizeSecondsToTime(videoState.currentTime || 0)}.png`
                        a.click()
                      }
                    })
                  }}
                />
                <Button.IconButton
                  icon="park-screenshot"
                  onClick={() => {
                    instance.captureCurrentImage?.().then(data => {
                      if (data) {
                        const videoMeta = videoState.videoId ? MetaStore.getMetaObjectByObjectId(videoState.videoId) : undefined
                        saveImageLocally(data, { compress: false }).then(res => {
                          ObjectStore('image').addOneWithMeta(
                            {
                              imageUrl: res
                            },
                            {
                              showMetaModal: false,
                              currentMeta: {
                                name: 'Video Screenshot',
                                coverImgSrc: res,
                                fromObject: videoMeta
                                  ? {
                                      metaId: videoMeta.id,
                                      type: 'video',
                                      time: videoState.currentTime
                                    }
                                  : undefined
                              }
                            }
                          )
                        })
                      }
                    })
                  }}
                  text={t('general.add screenshot')}
                ></Button.IconButton>
                <Button.IconButton
                  onClick={() => {
                    instance.insertChapter?.({
                      startTime: videoState.currentTime,
                      name: 'Untitled Chapter'
                    })
                  }}
                  text={t('general.add chapter')}
                  icon="park-link"
                ></Button.IconButton>
                <Button.IconButton
                  icon="park-pin"
                  onClick={() => {
                    instance.insertLabel?.({
                      videoTime: videoState.currentTime,
                      name: 'Unnamed Label'
                    })
                  }}
                  text={t('general.add label')}
                ></Button.IconButton>
              </WithBorder>
            )}
            name="park-plus"
            className={ClassName.circleButton()}
            strokeWidth={6}
          ></IconWithPopover>
        )}
        <IconWithPopover
          placement={['top', 'bottom']}
          padding={10}
          closeOnContentClick
          disableNudge={true}
          renderOnParent={false}
          content={
            <WithBorder padding={6} style={{ minWidth: 150, fontSize: FontSize['14px'] }}>
              <Button.IconButton
                icon="park-stretching"
                text={videoState.floated ? t('general.normal video') : t('general.windowed video')}
                onClick={() => setVideoState(s => ({ ...s, floated: !s.floated }))}
              />
              <Button.IconButton
                icon="park-plus"
                text={t('general.add attachment')}
                onClick={() => setBarState(s => ({ ...s, addingAttachment: true }))}
              ></Button.IconButton>
              <Button.IconButton
                icon="park-align-text-bottom-one"
                text={t('general.import subtitles')}
                onClick={() => {
                  Rendevoz.Actions.Utils.uploadFile().then(files => {
                    const file = files[0]
                    if (file) {
                      if (file.name.endsWith('srt')) {
                        toWebVTT(file)
                          .then(res => {
                            const url = res
                            setVideoState(s => ({ ...s, subtitleUrl: url, showSubtitle: true }))
                            fetch(url)
                              .then(s => s.blob())
                              .then(r => {
                                saveBlobLocally(r, `subtitles_${Id.getId()}`).then(s => {
                                  const id = videoState.videoId
                                  if (id) {
                                    ObjectStore('video').updateOne({ id, subtitleUrl: s })
                                  }
                                })
                              })
                          })
                          .catch(e => {
                            toast.error('Unsupported Subtitle File!')
                          })
                      }
                      if (file.name.endsWith('vtt')) {
                        saveFileLocally(file.path, file.name).then(res => {
                          const id = videoState.videoId
                          if (id) {
                            ObjectStore('video').updateOne({ id, subtitleUrl: res.data })
                          }
                        })
                      }
                    }
                    toast.error('Failed to import subtitle! Only supports .srt or .vtt file!')
                  })
                }}
              ></Button.IconButton>
              <Content
                onClick={e => {
                  e.stopPropagation()
                  setSetting(
                    produce(setting, s => {
                      s.video.loop = !s.video.loop
                    })
                  )
                }}
                fullWidth
                flex
                alignItems="center"
                justifyContent="space-between"
                className={ClassName.flatButton()}
                gap={28}
              >
                <Content flex gap={10}>
                  <Icon name="park-play-cycle" />
                  <div>{t('general.loop play')}</div>
                </Content>
                <Switch value={setting.video.loop}></Switch>
              </Content>
              <Content
                onClick={e => {
                  e.stopPropagation()
                  setSetting(
                    produce(setting, s => {
                      s.video.autoPlay = !s.video.autoPlay
                    })
                  )
                }}
                fullWidth
                flex
                alignItems="center"
                justifyContent="space-between"
                className={ClassName.flatButton()}
                gap={28}
              >
                <Content flex gap={10}>
                  <Icon name="park-play" />
                  <div>{t('general.auto play')}</div>
                </Content>
                <Switch value={setting.video.autoPlay}></Switch>
              </Content>
            </WithBorder>
          }
          name="park-more"
          className={ClassName.circleButton()}
          style={{ flexShrink: 0 }}
        />
      </Content>
      {videoMeta?.description && (
        <div className={ClassName.description()} style={{ whiteSpace: 'pre-wrap' }}>
          {videoMeta.description}
        </div>
      )}
      <div style={{ marginTop: 16, width: '100%' }}>
        <AttachmentWrapper
          closeIcon={videoMeta?.attachments?.length === 0 || (barState?.addingAttachment && !videoMeta?.attachments?.length)}
          onClose={() => setBarState(s => ({ ...s, addingAttachment: false }))}
          maxVisibleAttachments={5}
          metaId={videoMeta?.id}
          visible={!!(barState?.addingAttachment || videoMeta?.attachments?.length)}
        />
      </div>
    </Content>
  )
}

export default VideoStatusBar
