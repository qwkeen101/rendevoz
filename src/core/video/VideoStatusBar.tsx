import { Button, Content, Icon, IconWithPopover, Switch, WithBorder } from '@/components'
import useVideoState from './hooks/useVideoState'
import { MetaStore } from '@/stores'
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

const VideoStatusBar = () => {
  const [videoState, setVideoState] = useVideoState()
  const videoMeta = videoState.videoId ? MetaStore.getMetaObjectByObjectId(videoState.videoId) : undefined
  const [barState, setBarState] = useState<{
    addingAttachment: boolean
  }>()
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
        <IconWithPopover
          placement={['top', 'bottom']}
          padding={10}
          closeOnContentClick
          disableNudge={true}
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
