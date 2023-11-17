import { Button, Content, Icon, IconWithPopover, Switch, WithBorder } from '@/components'
import useMediaState from './hooks/useMediaState'
import ClassName from '@/styles/classNames'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'
import useMediaSidebarState from './hooks/useMediaSidebarState'
import { css } from '@emotion/css'
import { useSetting } from '../../setting'
import produce from 'immer'
import MediaActionsMenu from '@/core/components/media/components/MediaActionsMenu'
import MediaSubtitleImporter from '@/core/components/media/components/MediaSubtitleImporter'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { Colors } from '@/consts'
import { GlobalInstance } from '@/hooks'

const MediaStatusBar = () => {
  const [mediaState, setMediaState] = useMediaState()
  const [barState, setBarState] = useState<{
    addingAttachment: boolean
  }>()
  const instance = useMediaInstance()
  const [sidebarState, setSidebarState] = useMediaSidebarState()
  const { t } = useTranslation()
  const [setting, setSetting] = useSetting()
  const [subtitleImporterVisible, setSubtitleImporterVisible] = useState(false)
  return (
    <>
      <MediaSubtitleImporter visible={subtitleImporterVisible} onChange={() => setSubtitleImporterVisible(false)} />
      <Content flex column style={{ margin: '16px 0px 0px' }}>
        <div style={{ width: '100%' }} className={css([ClassName.title(FontSize['18px']), ClassName.ellipsisFont(1)])}>
          {mediaState?.name}
        </div>
        <Content flex justifyContent="space-between" alignItems="center" gap={10} className={ClassName.description(FontSize['12px'])}>
          <Icon
            name={'park-like'}
            theme={mediaState.isPinned ? 'filled' : undefined}
            style={{ color: !mediaState.isPinned ? Colors.Common.Red : undefined, transition: 'color 0.2s ease' }}
            size={20}
          />
          <div
            onClick={() => {
              GlobalInstance.collectionOps?.selectCollection()
            }}
          >
            select
          </div>
          <Button.IconButton
            icon="park-edit"
            text={t('general.edit details')}
            style={{ flexShrink: 0 }}
            onClick={() => {
              instance.on?.({
                type: 'editDetails'
              })
            }}
          ></Button.IconButton>
          {mediaState.mode === 'web' && (
            <IconWithPopover
              padding={0}
              content={setState => <MediaActionsMenu onClose={() => setState(false)} />}
              name="park-plus"
              className={ClassName.circleButton()}
              strokeWidth={6}
            ></IconWithPopover>
          )}

        </Content>
        {mediaState?.description && (
          <div className={ClassName.description()} style={{ whiteSpace: 'pre-wrap' }}>
            {mediaState.description}
          </div>
        )}
        {/*{!!(barState?.addingAttachment || videoMeta?.attachments?.length) && (*/}
        {/*  <div style={{ marginTop: 32, width: '100%' }}>*/}
        {/*    <AttachmentWrapper*/}
        {/*      closeIcon={videoMeta?.attachments?.length === 0 || (barState?.addingAttachment && !videoMeta?.attachments?.length)}*/}
        {/*      onClose={() => setBarState(s => ({ ...s, addingAttachment: false }))}*/}
        {/*      maxVisibleAttachments={5}*/}
        {/*      metaId={videoMeta?.id}*/}
        {/*      visible={true}*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*)}*/}
      </Content>
    </>
  )
}

export default MediaStatusBar
