import { useGlobalAtom } from '@/hooks'
import { ClassName } from 'rendevoz'
import { AnimatePopover, Content, WithBorder } from '@/components'
import { memo } from 'react'
import { GlobalSetting } from '@/core'
import SyncAPI from '@/api/sync'
import { DateFormat } from '@/utils'
import { useTranslation } from 'react-i18next'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import DownloadList from '@/api/sync/components/DownloadList'
import useSyncInfo from '@/api/sync/components/useSyncInfo'
import UploadList from '@/api/sync/components/UploadList'
import SyncTitlebar from '@/api/sync/components/TitleBar'

export default memo(() => {
  const [syncState, setSyncState] = useGlobalAtom(SyncAPI.stateAtom)
  const setSetting = GlobalSetting.setSetting
  const syncSetting = GlobalSetting.useSelectSettingAtom('sync')
  let connection = syncState.connection
  if (Object.values(syncState.downloading).some(i => i.progress !== 1) || Object.values(syncState.uploading).some(i => i.progress !== 1)) {
    connection = 'syncing'
  }
  const { renderInfo, clearInfo, fetchInfo } = useSyncInfo()
  const { t } = useTranslation()
  const clear = (type: 'downloading' | 'uploading') => {
    setSyncState(s => ({
      ...s,
      [type]: Object.fromEntries(Object.entries(s[type]).filter(i => i[1].progress !== 1))
    }))
  }
  const showInfo = connection !== 'syncing'
  const bg = SyncAPI.connectionToColors[connection]
  if (syncSetting.enableSync !== true) return null
  return (
    <AnimatePopover
      positions={['bottom']}
      align={'start'}
      padding={4}
      onVisiblityChange={v => {
        if (v && connection === 'connected') {
          fetchInfo()
        } else {
          clearInfo()
        }
      }}
      content={
        <WithBorder
          padding={8}
          style={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 600,
            overflowY: 'auto',
            gap: 4
          }}
        >
          <SyncTitlebar
            bg={bg}
            connection={connection}
            onClearTasks={() => {
              clear('uploading')
              clear('downloading')
            }}
            onClearInfo={() => {
              clearInfo()
            }}
          />
          {showInfo && renderInfo()}
          {syncState.lastSynced && (
            <div className={'transparent-font font-size-12'}>
              {t('sync.Last synced at')} {DateFormat.format(syncState.lastSynced, DateFormat.Formats.withMinute)}
            </div>
          )}
          {syncSetting.conflictResolved && syncSetting.enableSync && (
            <ButtonSwitch
              name={t('settings.Auto sync')}
              className={'font-size-13'}
              disableButtonStyle
              value={!!syncSetting.enableAutoSync}
              onChange={v => {
                setSetting(s => ({ ...s, sync: { ...s.sync, enableAutoSync: v } }))
              }}
            />
          )}
          <UploadList onClear={() => clear('uploading')} />
          <DownloadList onClear={() => clear('downloading')} />
        </WithBorder>
      }
    >
      <Content
        flex
        centered
        style={{
          width: 26,
          height: '26px',
          appRegion: 'no-drag'
        }}
        className={ClassName.flatButton(4, '4px')}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 99,
            background: bg
          }}
        ></div>
      </Content>
    </AnimatePopover>
  )
})
