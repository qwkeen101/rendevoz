import { useGlobalAtom, useSelectGlobalAtomValue } from '@/hooks'
import { ClassName } from 'rendevoz'
import { AnimatePopover, Content, Icon, WithBorder } from '@/components'
import { memo, useState } from 'react'
import { formatBytes } from '@/utils/fetchProcess'
import { Colors } from '@/consts'
import { getSetting, SettingAtom } from '@/core'
import SyncAPI from '@/api/sync'
import { DateFormat } from '@/utils'
import toast from 'react-hot-toast'

export default memo(() => {
  const [syncState, setSyncState] = useGlobalAtom(SyncAPI.stateAtom)
  const [isPushing, setIsPushing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const syncSetting = useSelectGlobalAtomValue(SettingAtom, s => s.sync)
  const connection = syncState.connection
  const renderDownloading = () => {
    if (Object.keys(syncState.downloading).length > 0) {
      const items = Object.values(syncState.downloading)
      const downloading = items.filter(i => i.progress < 1)
      return (
        <>
          <Content flex alignItems={'center'} justifyContent={'space-between'} style={{ margin: '6px 0px 4px' }}>
            <div className={'transparent-font font-size-12 normal-font'}>
              {downloading.length ? `Downloading ${downloading.length} files...` : 'All files downloaded'}
            </div>
            <div
              className={'normal-font select-color-font font-size-12 pointer'}
              onClick={() => {
                setSyncState(s => ({ ...s, downloading: {} }))
              }}
            >
              Clear
            </div>
          </Content>
          <Content flex column gap={4}>
            {items.map(i => (
              <Content gap={12} flex justifyContent={'space-between'} key={i.name}>
                <Content flex gap={8} alignItems={'center'}>
                  <Icon
                    style={{
                      borderRadius: 99,
                      padding: 3,
                      color: Colors.Common.SelectColor,
                      background: i.progress === 1 ? Colors.Common.SelectColorTransparentLight : 'transparent'
                    }}
                    size={12}
                    spin={i.progress !== 1}
                    name={i.progress === 1 ? 'park-check' : 'park-loading-four'}
                  />
                  <div title={i.name} className={'ellipsis-font-1 font-size-13'}>
                    {i.name.split('/')[1]}
                  </div>
                </Content>

                <div style={{ flexShrink: 0 }} className={'transparent-font font-size-12'}>
                  {formatBytes(i.size, 1)}
                </div>
              </Content>
            ))}
          </Content>
        </>
      )
    }
  }
  const renderUploading = () => {
    if (Object.keys(syncState.uploading).length > 0) {
      const items = Object.values(syncState.uploading)
      const uploading = items.filter(i => i.progress < 1 && !i.skiped)
      const skiped = items.filter(i => i.skiped)
      return (
        <>
          <Content flex alignItems={'center'} justifyContent={'space-between'} style={{ margin: '6px 0px 4px' }}>
            <div className={'transparent-font font-size-12 normal-font'}>
              {uploading.length ? `Uploading ${uploading.length} files...` : 'All files uploaded'}
              {skiped.length ? ` (${skiped.length} skipped)` : ''}
            </div>
            <div
              className={'normal-font select-color-font font-size-12 pointer'}
              onClick={() => {
                setSyncState(s => ({ ...s, uploading: {} }))
              }}
            >
              Clear
            </div>
          </Content>
          <Content flex column gap={4}>
            {items.map(i => (
              <Content gap={12} flex justifyContent={'space-between'} key={i.name}>
                <Content flex gap={8} alignItems={'center'}>
                  <Icon
                    style={{
                      borderRadius: 99,
                      padding: 2,
                      cursor: i.skiped ? 'pointer' : undefined,
                      color: i.skiped ? Colors.Common.Red : Colors.Common.SelectColor,
                      background: i.skiped
                        ? Colors.Common.RedTransparentLight
                        : i.progress === 1
                        ? Colors.Common.SelectColorTransparentLight
                        : 'transparent'
                    }}
                    onClick={() => {
                      if (i.skiped) {
                        const setting = getSetting()
                        const s3Config = setting.sync.S3Config
                        if (s3Config && s3Config.bucket && s3Config.region && s3Config.endpoint && s3Config.sk && s3Config.ak) {
                          SyncAPI.cloudClient()?.uploadFile(i.name, { ...s3Config, skipSetting: true })
                        }
                      }
                    }}
                    size={14}
                    spin={i.progress !== 1 && !i.skiped}
                    name={i.skiped ? 'park-pause' : i.progress === 1 ? 'park-check-small' : 'park-loading-four'}
                  />
                  <div title={i.name} className={'ellipsis-font-1 font-size-13'}>
                    {i.name.split('/')[1]}
                  </div>
                </Content>

                <div style={{ flexShrink: 0 }} className={'transparent-font font-size-12'}>
                  {formatBytes(i.size, 1)}
                </div>
              </Content>
            ))}
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
            overflowY: 'auto'
          }}
        >
          <Content flex alignItems={'center'} justifyContent={'space-between'}>
            <Content alignItems={'center'} className={'font-size-14 bold-font'} flex gap={8}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  background: bg,
                  borderRadius: 99
                }}
              ></div>
              <div>{SyncAPI.connectionToText[connection]}</div>
            </Content>
            {syncSetting.enableSync && connection === 'connected' && syncSetting.enableAutoSync !== true && (
              <Content flex gap={2} className={'transparent-font'} style={{ marginRight: -2 }}>
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
                  name={isPushing ? 'park-loading-four' : 'park-arrow-circle-up'}
                  className={ClassName.flatButton(4, '4px')}
                />
                <Icon
                  spin={isPulling}
                  name={isPulling ? 'park-loading-four' : 'park-arrow-circle-down'}
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
              </Content>
            )}
          </Content>
          {syncState.lastSynced && (
            <div className={'transparent-font font-size-12'}>
              Last synced at {DateFormat.format(syncState.lastSynced, DateFormat.Formats.withMinute)}
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
