import useMediaState from '@/core/components/media/hooks/useMediaState'
import useMediaSidebarState from '@/core/components/media/hooks/useMediaSidebarState'
import { AnimatePopover, Button, Content, Icon, IconWithPopover, Menu, Switch, Tooltip, WithBorder } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import MediaSubtitleImporter from '@/core/components/media/components/MediaSubtitleImporter'
import { useState } from 'react'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/index'
import { MediaLayoutAtom } from '@/core/components/media/hooks/useVideoLayout'
import MediaMoreMenu from '@/core/components/media/components/MediaMoreMenu'
import classnames from 'classnames'
import { GlobalSetting } from '@/core'

const clazz = css({
  borderRadius: `999px !important`,
  border: '1px solid var(--border-background)',
  cursor: 'pointer',
  height: '32px'
})
export default ({ showDetails }: { showDetails: boolean }) => {
  const [mediaState, setMediaState] = useMediaState()
  const [sidebarState, setSidebarState] = useMediaSidebarState()
  const instance = useMediaInstance()
  const { t } = useTranslation()
  const subtitleInSidebar = GlobalSetting.useSelectSettingAtom('subtitleInSidebar')
  const [subtitleImporterVisible, setSubtitleImporterVisible] = useState(false)
  const canHighlight = mediaState.currentTime !== undefined && mediaState.loaded
  const validSubtitleIcon = mediaState.subtitleList?.length || sidebarState.subtitleOpen
  return (
    <Content flex column gap={10} fullWidth>
      {mediaState.mode === 'web' && showDetails && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            gap: 4,
            alignItems: 'center'
          }}
          className={'transparent-font font-size-13'}
        >
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
        <Content flex gap={8} style={{ flexWrap: 'wrap' }}>
          <Button.IconButton
            size={18}
            theme={mediaState.isPinned ? 'filled' : undefined}
            className={clazz}
            onClick={() => instance.on?.({ type: 'pin' })}
            style={{
              color: mediaState.isPinned ? Colors.Common.Red : undefined,
              transition: 'all 0.2s ease',
              padding: '4px 12px'
            }}
            text={mediaState.isPinned ? t('general.unpin') : t('general.pin')}
            icon={'park-like'}
          />
          <Button.IconButton
            icon="park-high-light"
            className={clazz}
            size={18}
            style={{
              padding: '4px 12px',
              color: !canHighlight ? Colors.Font.SuperTransparent : undefined,
              cursor: !canHighlight ? 'not-allowed' : 'pointer'
            }}
            onClick={() => {
              if (canHighlight) {
                instance.insertLabel?.({
                  time: mediaState.currentTime
                })
              }
            }}
            text={t('general.Media highlight')}
          ></Button.IconButton>
          {subtitleInSidebar === false && (
            <Button.IconButton
              size={18}
              text={t('general.Subtitles')}
              icon={'custom-CC'}
              style={{
                padding: '4px 12px',
                ...(validSubtitleIcon
                  ? {}
                  : {
                      cursor: 'not-allowed',
                      background: 'transparent',
                      color: Colors.Font.SuperTransparent
                    })
              }}
              className={classnames(clazz, sidebarState.subtitleOpen && 'active-button select-color-border')}
              onClick={() =>
                (sidebarState.subtitleOpen || mediaState.subtitleList?.length) &&
                setSidebarState(s => ({ ...s, subtitleOpen: !s.subtitleOpen }))
              }
            ></Button.IconButton>
          )}
          <AnimatePopover
            padding={10}
            positions={['bottom', 'top']}
            content={setV => (
              <WithBorder padding={'0.2rem 0 0.4rem'}>
                <Menu.NavigationMenu
                  onSelect={v => {
                    setV(false)
                    if (v && v.type === 'item') {
                      setSidebarState(s => ({ ...s, rightBarActive: v.key }))
                    }
                  }}
                  defaultSelected={sidebarState.rightBarActive ? [sidebarState.rightBarActive] : undefined}
                  layout={[
                    {
                      type: 'title',
                      name: t('general.Sidebar')
                    },
                    {
                      type: 'item',
                      key: 'hide',
                      text: t('general.Hide sidebar')
                    },
                    {
                      type: 'item',
                      key: 'label',
                      text: t('general.Highlights')
                    },
                    {
                      type: 'item',
                      key: 'chapter',
                      text: t('general.Chapters')
                    },
                    subtitleInSidebar
                      ? {
                          type: 'item',
                          key: 'subtitle',
                          text: t('general.Subtitles')
                        }
                      : undefined,
                    mediaState.metaId
                      ? {
                          type: 'item',
                          key: 'attachments',
                          text: t('general.Attachments')
                        }
                      : undefined
                  ]}
                />
              </WithBorder>
            )}
          >
            <Content flex gap={10} className={classnames(ClassName.flatButton(), clazz)} style={{ padding: '4px 12px' }}>
              <Icon size={18} name={'custom-right-bar'} />
              <div>{t('general.Sidebar view')}</div>
              <Icon size={14} name={'park-down'} />
            </Content>
          </AnimatePopover>
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
          <IconWithPopover
            padding={10}
            renderOnParent={false}
            placement={['bottom', 'top']}
            content={setV => <MediaMoreMenu onClose={() => setV(false)} onImportSubtitle={() => setSubtitleImporterVisible(true)} />}
            name="park-more"
            className={classnames(ClassName.flatButton(), clazz)}
            size={20}
            style={{
              height: '100%',
              padding: '5px'
            }}
          />
        </Content>
      </Content>
    </Content>
  )
}
