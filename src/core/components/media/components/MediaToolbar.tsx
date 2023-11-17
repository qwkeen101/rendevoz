import useMediaState from '@/core/components/media/hooks/useMediaState'
import useMediaSidebarState from '@/core/components/media/hooks/useMediaSidebarState'
import { Button, Content, Icon, IconWithPopover, Switch, Tooltip, WithBorder } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import FontSize from '@/consts/font'
import produce from 'immer'
import { useTranslation } from 'react-i18next'
import MediaSubtitleImporter from '@/core/components/media/components/MediaSubtitleImporter'
import { useState } from 'react'
import { css } from '@emotion/css'
import MediaActionsMenu from '@/core/components/media/components/MediaActionsMenu'
import { AttachmentWrapper } from '@/core'
import { MetaStore } from '@/api/stores'

const clazz = css({
  borderRadius: `999px !important`,
  backgroundColor: Colors.Background.Secondary,
  fontWeight: 600
})
export default () => {
  const [mediaState, setMediaState] = useMediaState()
  const [sidebarState, setSidebarState] = useMediaSidebarState()
  const instance = useMediaInstance()
  const { t } = useTranslation()
  const [subtitleImporterVisible, setSubtitleImporterVisible] = useState(false)
  const [barState, setBarState] = useState<{
    addingAttachment: boolean
  }>()
  const attachmentLength = MetaStore.useValue(mediaState.metaId)?.attachments?.length
  return (
    <>
      <Content flex fullWidth alignItems={'center'} justifyContent={'space-between'} gap={30}>
        <MediaSubtitleImporter visible={subtitleImporterVisible} onChange={() => setSubtitleImporterVisible(false)} />
        <Content flex gap={8}>
          <Button.IconButton
            theme={mediaState.isPinned ? 'filled' : undefined}
            className={clazz}
            onClick={() => instance.on?.({ type: 'pin' })}
            style={{ color: mediaState.isPinned ? Colors.Common.Red : undefined, transition: 'all 0.2s ease', padding: '4px 12px' }}
            text={mediaState.isPinned ? 'Unpin' : 'Pin'}
            icon={'park-like'}
          />
          <Button.IconButton
            className={clazz}
            text={'Assign to collection'}
            style={{ padding: '4px 12px' }}
            onClick={() => instance.on?.({ type: 'assignToNewCollection' })}
            icon={'park-folder-close'}
          />
          <Button.IconButton
            className={clazz}
            text={'Open sidebar'}
            onClick={() => {
              setSidebarState(s => ({ ...s, rightBarVisible: !s.rightBarVisible }))
            }}
            style={{ padding: '4px 12px' }}
            icon={'park-right-bar'}
          />
          {mediaState.isTranscribing && (
            <Tooltip content={'Click to cancel'}>
              <Button.IconButton
                className={clazz}
                text={'Transcribing'}
                onClick={() => {
                  instance.cancelTranscribe?.()
                }}
                spin={true}
                style={{ padding: '4px 12px' }}
                icon={'park-loading-four'}
              />
            </Tooltip>
          )}
          {mediaState.mode === 'web' && (
            <IconWithPopover
              padding={10}
              renderOnParent={false}
              content={setState => <MediaActionsMenu onClose={() => setState(false)} />}
              name="park-tool"
              className={css([ClassName.flatButton(), clazz])}
              size={20}
              style={{
                height: '100%',
                padding: '6px'
              }}
            ></IconWithPopover>
          )}
          <IconWithPopover
            placement={['bottom', 'top']}
            padding={10}
            closeOnContentClick
            disableNudge={true}
            renderOnParent={false}
            content={
              <WithBorder padding={6} style={{ minWidth: 150, fontSize: FontSize['14px'] }}>
                <Button.IconButton
                  icon="park-stretching"
                  text={mediaState.floated ? t('general.normal video') : t('general.windowed video')}
                  onClick={() => setMediaState(s => ({ ...s, floated: !s.floated }))}
                />
                <Button.IconButton
                  icon="park-plus"
                  text={t('general.add attachment')}
                  onClick={() => setBarState(s => ({ ...s, addingAttachment: true }))}
                ></Button.IconButton>
                {mediaState.mode === 'audio' && (
                  <Button.IconButton
                    icon="park-voice"
                    text={t('general.Transcribe audio')}
                    onClick={() => instance.transcribe?.()}
                  ></Button.IconButton>
                )}
                <Button.IconButton
                  icon="park-align-text-bottom-one"
                  text={t('general.import subtitles')}
                  onClick={() => setSubtitleImporterVisible(true)}
                ></Button.IconButton>
              </WithBorder>
            }
            name="park-more"
            className={css([ClassName.flatButton(), clazz])}
            size={20}
            style={{
              height: '100%',
              padding: '6px'
            }}
          />
        </Content>
      </Content>
      {mediaState.metaId && (
        <AttachmentWrapper
          closeIcon={true}
          visible={!!(barState?.addingAttachment || attachmentLength)}
          onClose={() => {
            setBarState(s => ({ ...s, addingAttachment: false }))
          }}
          metaId={mediaState.metaId}
        />
      )}
    </>
  )
}
