import { useGlobalAtom, useGlobalSetAtom, useSelectGlobalAtomValue } from '@/hooks'
import { ClassName } from 'rendevoz'
import { AnimatePopover, Content, Icon, WithBorder } from '@/components'
import { memo, useEffect, useState } from 'react'
import { formatBytes } from '@/utils/fetchProcess'
import { Colors } from '@/consts'
import { getSetting, SettingAtom } from '@/core'
import SyncAPI from '@/api/sync'
import { DateFormat } from '@/utils'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import ButtonSwitch from '@/components/base/ButtonSwitch'

export default memo(() => {
  const [syncState, setSyncState] = useGlobalAtom(SyncAPI.stateAtom)
  const [isPushing, setIsPushing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [showMoreDownloads, setShowMoreDownloads] = useState(false)
  const [showMoreUploads, setShowMoreUploads] = useState(false)
  const setSetting = useGlobalSetAtom(SettingAtom)
  const syncSetting = useSelectGlobalAtomValue(SettingAtom, s => s.sync)
  let connection = syncState.connection
  if (Object.values(syncState.downloading).some(i => i.progress < 1) || Object.values(syncState.uploading).some(i => i.progress < 1)) {
    connection = 'syncing'
  }
  const { t } = useTranslation()
  const clear = (type: 'downloading' | 'uploading') => {
    setSyncState(s => ({
      ...s,
      [type]: { ...Object.values(s[type]).filter(i => i.progress < 1) }
    }))
    setShowMoreUploads(false)
    setShowMoreDownloads(false)
  }
  const renderItem = (
    i: { error?: boolean; skiped?: boolean; name: string; progress: number; size: number },
    type: 'download' | 'upload'
  ) => (
    <Content gap={12} flex justifyContent={'space-between'} key={i.name}>
      <Content flex gap={8} alignItems={'center'}>
        <Icon
          style={{
            borderRadius: 99,
            padding: 2,
            cursor: i.skiped || i.error ? 'pointer' : undefined,
            color: i.skiped || i.error ? Colors.Common.Red : Colors.Common.SelectColor,
            background: i.progress === 1 ? Colors.Common.SelectColorTransparentLight : 'transparent'
          }}
          onClick={() => {
            if (i.skiped || i.error) {
              if (type === 'upload') {
                SyncAPI.cloudClient()?.uploadFile(i.name, {
                  skipSetting: true
                })
              } else {
                SyncAPI.cloudClient()?.downloadFile(i.name)
              }
            }
          }}
          size={14}
          spin={i.progress !== 1 && !i.skiped && !i.error}
          name={i.skiped ? 'park-pause' : i.error ? 'park-close' : i.progress === 1 ? 'park-check-small' : 'park-loading-four'}
        />
        <div title={i.name} className={'ellipsis-font-1 font-size-13'}>
          {i.name.split('/')[1]}
        </div>
      </Content>

      <div style={{ flexShrink: 0 }} className={'transparent-font font-size-12'}>
        {formatBytes(i.size, 1)}
      </div>
    </Content>
  )
  const renderDownloading = () => {
    if (Object.keys(syncState.downloading).length > 0) {
      const items = Object.values(syncState.downloading)
      const downloading = items.filter(i => i.progress < 1 || i.error)
      const leftItems = downloading.length ? 0 : Math.max(0, items.length - 50)
      const visibleItems = downloading.length ? downloading : showMoreDownloads ? items : items.slice(0, 50)
      return (
        <>
          <Content flex alignItems={'center'} justifyContent={'space-between'} style={{ marginTop: 4 }}>
            <div className={'transparent-font font-size-12'}>
              {downloading.length ? t('sync.Downloading files', { num: downloading.length }) : t('sync.All files downloaded')}
            </div>
            <div
              className={'normal-font select-color-font font-size-12 pointer'}
              onClick={() => {
                clear('downloading')
              }}
            >
              {t('sync.Clear')}
            </div>
          </Content>
          <Content flex column gap={4}>
            {visibleItems.map(i => renderItem(i, 'download'))}
            {leftItems > 0 && !showMoreDownloads ? (
              <div onClick={() => setShowMoreDownloads(true)} className={'transparent-font font-size-12 link'}>
                {t('general.More sync files', { num: leftItems })}
              </div>
            ) : null}
          </Content>
        </>
      )
    }
  }
  const renderUploading = () => {
    if (Object.keys(syncState.uploading).length > 0) {
      const items = Object.values(syncState.uploading)
      const uploading = items.filter(i => (i.progress < 1 && !i.skiped) || i.error)
      const skiped = items.filter(i => i.skiped)
      const leftItems = uploading.length || skiped.length ? 0 : Math.max(0, items.length - 50)
      const visibleItems = uploading.length || skiped.length ? [...uploading, ...skiped] : showMoreUploads ? items : items.slice(0, 50)
      return (
        <>
          <Content flex alignItems={'center'} justifyContent={'space-between'} style={{ marginTop: 4 }}>
            <div className={'transparent-font font-size-12'}>
              {uploading.length ? t('sync.Uploading files', { num: uploading.length }) : t('sync.All files uploaded')}
              {skiped.length ? t('sync.Files skipped', { num: skiped.length }) : ''}
            </div>
            <div
              className={'normal-font select-color-font font-size-12 pointer'}
              onClick={() => {
                clear('uploading')
              }}
            >
              {t('sync.Clear')}
            </div>
          </Content>
          <Content flex column gap={4}>
            {visibleItems.map(i => renderItem(i, 'upload'))}
            {leftItems > 0 && !showMoreUploads ? (
              <div onClick={() => setShowMoreUploads(true)} className={'transparent-font font-size-12 link'}>
                {t('general.More sync files', { num: leftItems })}
              </div>
            ) : null}
          </Content>
        </>
      )
    }
  }
  const bg = SyncAPI.connectionToColors[connection]
  if (syncSetting.enableSync !== true) return null
  return (
    <AnimatePopover
      positions={['bottom']}
      align={'start'}
      content={
        <WithBorder
          padding={'6px 8px'}
          style={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 500,
            overflowY: 'auto',
            gap: 3
          }}
        >
          <Content flex alignItems={'center'} justifyContent={'space-between'}>
            <Content alignItems={'center'} className={'font-size-14 normal-font'} flex gap={8}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  background: bg,
                  borderRadius: 99
                }}
              ></div>
              <div>{t(`sync.${SyncAPI.connectionToText[connection]}`)}</div>
            </Content>
            {syncSetting.enableSync && (
              <Content flex gap={3} style={{ marginRight: -2 }}>
                {connection === 'syncing' && (
                  <Icon
                    name={'park-close'}
                    style={{
                      color: Colors.Common.Red
                    }}
                    onClick={() => {
                      SyncAPI.cloudClient()?.cancelAllTasks()
                    }}
                    className={ClassName.flatButton(4, '4px')}
                  />
                )}
                {connection === 'connected' && (
                  <>
                    <Icon
                      onClick={() => {
                        setIsPushing(true)
                        SyncAPI.resolveConflict('push')
                          .catch(e => {
                            toast.error('Failed to push data!')
                          })
                          .finally(() => {
                            setIsPushing(false)
                          })
                      }}
                      spin={isPushing}
                      name={isPushing ? 'park-loading-four' : 'park-arrow-up'}
                      className={ClassName.flatButton(4, '4px')}
                    />
                    <Icon
                      spin={isPulling}
                      name={isPulling ? 'park-loading-four' : 'park-arrow-down'}
                      onClick={() => {
                        setIsPulling(true)
                        SyncAPI.resolveConflict('pull')
                          .catch(() => {
                            toast.error('Failed to pull data!')
                          })
                          .finally(() => {
                            setIsPulling(false)
                          })
                      }}
                      className={ClassName.flatButton(4, '4px')}
                    />
                    <Icon
                      name={'park-file-conversion-one'}
                      className={ClassName.flatButton(4, '4px')}
                      onClick={() => {
                        SyncAPI.file.syncLocalFiles()
                      }}
                    />
                  </>
                )}
              </Content>
            )}
          </Content>
          {syncSetting.conflictResolved && syncSetting.enableSync && (
            <ButtonSwitch
              name={t('settings.Auto sync')}
              className={'font-size-13'}
              disableButtonStyle
              style={{ marginTop: 2 }}
              value={!!syncSetting.enableAutoSync}
              onChange={v => {
                setSetting(s => ({ ...s, sync: { ...s.sync, enableAutoSync: v } }))
              }}
            />
          )}
          {syncState.lastSynced && (
            <div className={'transparent-font font-size-12'}>
              {t('sync.Last synced at')} {DateFormat.format(syncState.lastSynced, DateFormat.Formats.withMinute)}
            </div>
          )}
          {renderUploading()}
          {renderDownloading()}
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
