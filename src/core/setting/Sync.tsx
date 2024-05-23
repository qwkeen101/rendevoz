import { Button, Content } from '@/components'
import { ISettingItem } from '@/core/setting/SettingItem'
import SettingGroup from '@/core/setting/SettingGroup'
import { useSetting } from '@/core'
import { useGlobalAtom, useUpdateEffect } from '@/hooks'
import SyncAPI from '@/api/sync'
import { memo, useEffect, useState } from 'react'
import { DateFormat } from '@/utils'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import getClientInfo from '@/api/sync/utils/getClientInfo'

export default memo(() => {
  const [setting, setSetting] = useSetting()
  const [syncState, setSyncState] = useGlobalAtom(SyncAPI.stateAtom)
  const [isPushing, setIsPushing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [remoteData, setRemoteData] = useState<{
    ip: string
    city: string
    region: string
    country: string
    time: number
    os: string
  }>()
  const renderRemote = () => {
    if (remoteData) {
      const renderRegion = remoteData.region && remoteData.region !== remoteData.country
      const renderCity = remoteData.city && remoteData.city !== remoteData.region && remoteData.city !== remoteData.country
      return (
        <Content flex className={'font-size-13 transparent-font'}>
          {t('settings.Remote data updated at')}
          {`: ${DateFormat.format(remoteData.time, DateFormat.Formats.withMinute)}`}
          <span style={{ marginLeft: 12, marginRight: 4 }}>{t('settings.Position')}:</span>
          <Content flex gap={3}>
            <span>{remoteData.country}</span>
            {renderRegion && (
              <>
                <span>-</span>
                <span>{remoteData.region}</span>
              </>
            )}
            {renderCity && (
              <>
                <span>-</span>
                <span>{remoteData.city}</span>
              </>
            )}
          </Content>
          <span style={{ marginLeft: 12 }}>{t('settings.Device')}</span>
          {`: ${remoteData.os}`}
        </Content>
      )
    }
  }
  const { t } = useTranslation()
  useEffect(() => {
    setRemoteData(undefined)
    if (syncState.connection === 'connected') {
      SyncAPI.cloudClient()
        ?.getFile('client-info.json')
        .then(res => {
          if (res) {
            const parsed = JSON.parse(res)
            setRemoteData(parsed)
          }
        })
    }
  }, [setting.sync.conflictResolved, syncState.connection, setting.sync.syncMode])
  useUpdateEffect(() => {
    setSyncState(s => ({ ...s, connection: 'unconnected' }))
    SyncAPI.cloudClient()?.cancelAllTasks()
    if (setting.sync.conflictResolved) {
      setSetting(s => ({ ...s, sync: { ...s.sync, conflictResolved: false, enableAutoSync: false } }))
    }
  }, [setting.sync.S3Config, setting.sync.webdavConfig, setting.sync.syncMode, setting.sync.enableSync])
  const s3Items: ISettingItem[] = [
    {
      title: 'Access key',
      type: 'input',
      width: 300,
      value: setting.sync.S3Config?.ak,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, ak: v } } }))
    },
    {
      title: 'Secert key',
      type: 'input',
      width: 300,
      value: setting.sync.S3Config?.sk,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, sk: v } } }))
    },
    {
      title: 'Endpoint',
      type: 'input',
      width: 300,
      value: setting.sync.S3Config?.endpoint,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, endpoint: v } } }))
    },
    {
      title: 'Region',
      type: 'input',
      width: 300,
      value: setting.sync.S3Config?.region,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, region: v } } }))
    },
    {
      title: 'Bucket',
      type: 'input',
      width: 300,
      value: setting.sync.S3Config?.bucket,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, bucket: v } } }))
    },
    {
      title: t('settings.Folder path'),
      type: 'input',
      width: 300,
      description: t('settings.Folder path desc'),
      value: setting.sync.S3Config?.defaultFolder,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, defaultFolder: v } } }))
    }
  ]
  const webdavItems: ISettingItem[] = [
    {
      title: 'URL',
      type: 'input',
      width: 300,
      value: setting.sync.webdavConfig?.url,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, webdavConfig: { ...s.sync.webdavConfig, url: v } } }))
    },
    {
      title: t('settings.Username'),
      type: 'input',
      width: 300,
      value: setting.sync.webdavConfig?.username,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, webdavConfig: { ...s.sync.webdavConfig, username: v } } }))
    },
    {
      title: t('settings.Password'),
      type: 'input',
      width: 300,
      value: setting.sync.webdavConfig?.password,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, webdavConfig: { ...s.sync.webdavConfig, password: v } } }))
    },
    {
      title: t('settings.Folder path'),
      type: 'input',
      width: 300,
      description: t('settings.Folder path desc'),
      value: setting.sync.webdavConfig?.defaultFolder,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, webdavConfig: { ...s.sync.webdavConfig, defaultFolder: v } } }))
    }
  ]
  const syncItems: (ISettingItem | undefined)[] = [
    {
      type: 'switch',
      title: t('settings.Enable cloud sync'),
      value: !!setting.sync.enableSync,
      onChange: v => {
        setSetting(s => ({ ...s, sync: { ...s.sync, enableSync: v } }))
      }
    },
    ...(setting.sync.enableSync
      ? [
          {
            type: 'select',
            options: [
              { children: 'S3', value: 's3' },
              { value: 'webdav', children: 'Webdav' }
            ],
            value: setting.sync.syncMode ?? 's3',
            title: t('settings.Sync mode'),
            onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, syncMode: v } }))
          },
          setting.sync.conflictResolved
            ? {
                type: 'switch',
                title: t('settings.Auto sync'),
                description: t('settings.Auto sync desc'),
                value: setting.sync.enableAutoSync ?? false,
                onChange: v => {
                  setSetting(s => ({
                    ...s,
                    sync: { ...s.sync, enableAutoSync: v }
                  }))
                }
              }
            : undefined,
          syncState.connection === 'connected'
            ? {
                title: setting.sync.conflictResolved ? t('settings.Sync manually') : t('settings.Resolve sync conflict'),
                column: true,
                description: setting.sync.conflictResolved ? undefined : t('settings.Resolve conflict desc'),
                children: (
                  <Content flex column gap={6} style={{ marginTop: 4 }}>
                    {renderRemote()}
                    <Content flex gap={8}>
                      <Button.IconButton
                        gap={2}
                        icon={'park-arrow-up'}
                        className={'border'}
                        text={isPushing ? `${t('settings.Pushing')}...` : t('settings.Push local')}
                        onClick={() => {
                          setIsPushing(true)
                          SyncAPI.resolveConflict('push')
                            .then(() => {
                              toast.success(t('settings.Data pushed successfully'))
                              setSetting(s => ({
                                ...s,
                                sync: {
                                  ...s.sync,
                                  conflictResolved: true
                                }
                              }))
                              getClientInfo().then(res => {
                                res && setRemoteData(res)
                              })
                            })
                            .catch(e => {
                              toast.error('Failed to push data!')
                            })
                            .finally(() => {
                              setIsPushing(false)
                            })
                        }}
                      ></Button.IconButton>
                      {remoteData && (
                        <Button.IconButton
                          gap={2}
                          icon={'park-arrow-down'}
                          text={isPulling ? `${t('settings.Pulling')}` : t('settings.Pull remote')}
                          className={'border'}
                          onClick={() => {
                            setIsPulling(true)
                            let prevAuto = setting.sync.enableAutoSync
                            SyncAPI.resolveConflict('pull')
                              .then(() =>
                                setSetting(s => ({
                                  ...s,
                                  sync: {
                                    ...s.sync,
                                    conflictResolved: true,
                                    enableAutoSync: prevAuto
                                  }
                                }))
                              )
                              .catch(e => {
                                toast.error('Failed to pull data!')
                              })
                              .finally(() => {
                                setIsPulling(false)
                              })
                          }}
                        ></Button.IconButton>
                      )}
                      <Button.IconButton
                        gap={2}
                        icon={'park-file-conversion-one'}
                        text={t('settings.Sync files')}
                        className={'border'}
                        onClick={() => {
                          SyncAPI.file.syncLocalFiles()
                        }}
                      ></Button.IconButton>
                    </Content>
                  </Content>
                )
              }
            : undefined
        ]
      : [])
  ].filter(i => i)
  const renderConnectionState = () => {
    return (
      <Content gap={10} flex alignItems={'center'} className={'font-size-14'}>
        <div
          style={{
            background: SyncAPI.connectionToColors[syncState.connection],
            width: 8,
            height: 8,
            borderRadius: 999
          }}
        ></div>
        {t(`sync.${SyncAPI.connectionToText[syncState.connection]}`)}
      </Content>
    )
  }
  return (
    <>
      <SettingGroup title={t('settings.Cloud sync')} layout={syncItems} />
      {setting.sync.enableSync && (setting.sync.syncMode ?? 's3') === 's3' && (
        <SettingGroup gap={10} title={t('settings.S3 config')} layout={s3Items} extra={renderConnectionState()} />
      )}
      {setting.sync.enableSync && setting.sync.syncMode === 'webdav' && (
        <SettingGroup gap={10} title={t('settings.Webdav config')} layout={webdavItems} extra={renderConnectionState()} />
      )}
    </>
  )
})
