import { useGlobalAtom } from '@/hooks'
import S3Sync from '@/api/sync/methods/s3'
import { ClassName } from 'rendevoz'
import { AnimatePopover, Content, Icon, WithBorder } from '@/components'
import { memo, useState } from 'react'
import { formatBytes } from '@/utils/fetchProcess'
import { Colors } from '@/consts'
import { getSetting } from '@/core'
import { ISyncOperation } from '@/api/sync/db/types'
import SyncAPI from '@/api/sync'
import { DateFormat } from '@/utils'

const statusToColor = {
  successful: 'rgb(117,195,58)',
  failed: 'rgb(255, 86, 86)',
  inProgress: 'rgb(255,189,86)',
  disconnected: 'rgb(202,202,202)'
}
export default memo(() => {
  const [syncState, setSyncState] = useGlobalAtom(S3Sync.stateAtom)
  const renderDownloading = () => {
    if (Object.keys(syncState.downloading).length > 0) {
      const items = Object.values(syncState.downloading)
      const downloading = items.filter(i => i.progress < 1)
      return (
        <>
          <Content flex alignItems={'center'} justifyContent={'space-between'} style={{ marginTop: 6 }}>
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
          {items.map(i => (
            <Content gap={12} flex justifyContent={'space-between'} style={{ padding: '4px 0px' }} key={i.name}>
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
          <Content flex alignItems={'center'} justifyContent={'space-between'} style={{ marginTop: 6 }}>
            <div className={'transparent-font font-size-12 normal-font'}>
              {uploading.length ? `Uploading ${uploading.length} files...` : 'All files uploaded'}
              {skiped.length ? ` (${skiped.length} ignored)` : ''}
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
          {items.map(i => (
            <Content gap={12} flex justifyContent={'space-between'} style={{ padding: '4px 0px' }} key={i.name}>
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
                        S3Sync.uploadFile(i.name, { ...s3Config, skipSetting: true })
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
        </>
      )
    }
  }

  const pushFakeChange = () => {
    SyncAPI.cloudClient().uploadData(
      `commits/${Date.now()}`,
      JSON.stringify({
        deviceId: '123',
        databaseTranscations: [
          {
            type: 'put',
            value: {
              time: 226.298013,
              imageUrl: 'rendefile:///imgs/ca2639ee4312eeb265454d252ceb8cac.png',
              specType: 'videoLabel',
              parentObjectId: 17422889182149,
              id: 17458495396805,
              updatedAt: 1714332856986,
              createdAt: 1714231295287,
              name: '567'
            },
            database: 'objects'
          },
          {
            type: 'put',
            value: {
              id: 17458495399365,
              name: '567',
              placeholderName: 'How to Be an Active Citizen and Spark Change | Gabriel Marmentini | TED - YouTube - 3:46',
              coverImgSrc: 'rendefile:///imgs/ca2639ee4312eeb265454d252ceb8cac.png',
              objectId: 17458495396805,
              type: 'videoLabel',
              fromObject: {
                type: 'video',
                metaId: 17422889183429
              },
              updatedAt: 1714332856933,
              createdAt: 1714231295317,
              workspace: 17370163652165,
              temp: true
            },
            database: 'metaObjects'
          }
        ],
        timestamp: Date.now()
      } as ISyncOperation)
    )
  }
  return (
    <AnimatePopover
      positions={['bottom']}
      align={'start'}
      content={
        <WithBorder
          padding={6}
          style={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 500,
            overflowY: 'auto'
          }}
        >
          {syncState.lastSynced && (
            <div className={'transparent-font font-size-12'}>
              Last synced at {DateFormat.format(syncState.lastSynced, DateFormat.Formats.withMinute)}
            </div>
          )}
          <div onClick={() => SyncAPI.file.syncLocalFiles()}>sync files</div>
          <div onClick={() => SyncAPI.pull()}>pull</div>
          <div onClick={() => SyncAPI.restoreFromDB()}>restore</div>
          <div onClick={() => pushFakeChange()}>push</div>
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
          'app-region': 'no-drag'
        }}
        className={ClassName.flatButton(4, '4px')}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 99,
            background: statusToColor['failed']
          }}
        ></div>
      </Content>
    </AnimatePopover>
  )
})
