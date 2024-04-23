import useMediaState from '@/core/components/media/hooks/useMediaState'
import useMediaSidebarState from '@/core/components/media/hooks/useMediaSidebarState'
import { Button, Content, Icon, IconWithPopover, Switch, Tooltip, WithBorder } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import FontSize from '@/consts/font'
import { useTranslation } from 'react-i18next'
import MediaSubtitleImporter from '@/core/components/media/components/MediaSubtitleImporter'
import { useState } from 'react'
import { css } from '@emotion/css'
import MediaActionsMenu from '@/core/components/media/components/MediaActionsMenu'
import { useAtomValue } from 'jotai/index'
import { MediaLayoutAtom } from '@/core/components/media/hooks/useVideoLayout'

const clazz = css({
  borderRadius: `999px !important`,
  backgroundColor: Colors.Background.ButtonHover,
  fontWeight: 600,
  ':hover': {
    backgroundColor: `${Colors.Background.ButtonActive} !important`
  }
})
export default ({ width }: { width: number }) => {
  const [mediaState, setMediaState] = useMediaState()
  const [sidebarState, setSidebarState] = useMediaSidebarState()
  const instance = useMediaInstance()
  const { t } = useTranslation()
  const columnLayout = useAtomValue(MediaLayoutAtom)
  const [subtitleImporterVisible, setSubtitleImporterVisible] = useState(false)
  return (
    <Content flex column gap={10} fullWidth>
      {mediaState.mode === 'web' && (!columnLayout || !sidebarState.rightBarVisible) && (
        <div style={{ width: '100%', display: 'flex', gap: 4, alignItems: 'center' }} className={'transparent-font font-size-13'}>
          <Icon name={'park-link-one'} />
          <a
            className={css({
              ':hover': {
                textDecoration: 'underline'
              },
              color: 'inherit'
            })}
            target={'_blank'}
            href={mediaState.url}
          >
            {mediaState.url}
          </a>
        </div>
      )}
      <Content flex fullWidth alignItems={'center'} justifyContent={'space-between'} gap={30}>
        <MediaSubtitleImporter visible={subtitleImporterVisible} onChange={() => setSubtitleImporterVisible(false)} />
        <Content flex gap={8}>
          <Button.IconButton
            theme={mediaState.isPinned ? 'filled' : undefined}
            className={clazz}
            onClick={() => instance.on?.({ type: 'pin' })}
            style={{ color: mediaState.isPinned ? Colors.Common.Red : undefined, transition: 'all 0.2s ease', padding: '4px 12px' }}
            text={mediaState.isPinned ? t('general.unpin') : t('general.pin')}
            icon={'park-like'}
          />
          {mediaState.mode === 'web' && mediaState.currentTime !== undefined && (
            <Button.IconButton
              icon="park-pin"
              className={clazz}
              style={{ padding: '4px 12px' }}
              onClick={() => {
                instance.insertLabel?.({
                  time: mediaState.currentTime
                })
              }}
              text={t('general.add label')}
            ></Button.IconButton>
          )}
          <Button.IconButton
            className={clazz}
            text={sidebarState.rightBarVisible ? t('general.Close sidebar') : t('general.Open sidebar')}
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
              name="park-more-four"
              className={css([ClassName.flatButton(), clazz])}
              size={20}
              style={{
                height: '100%',
                padding: '6px'
              }}
            ></IconWithPopover>
          )}
          <IconWithPopover
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
                {(mediaState.mode === 'audio' || mediaState.mode === 'video') && (
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
                <Button.IconButton
                  text={t('general.Move to')}
                  onClick={() => instance.on?.({ type: 'assignToNewCollection' })}
                  icon={'park-corner-up-right'}
                />
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
    </Content>
  )
}
