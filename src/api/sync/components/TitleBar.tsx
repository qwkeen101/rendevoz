import { memo, useState } from 'react'
import { Content, Icon } from '@/components'
import SyncAPI from '@/api/sync'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import toast from 'react-hot-toast'
import { GlobalSetting } from '@/core'
import { useTranslation } from 'react-i18next'
import { useGlobalSetAtom } from '@/hooks'

const SyncTitlebar = memo(
  ({ connection, onClearInfo, bg }: { connection: string; onClearInfo: VoidFunction; bg: string }) => {
    const setSyncState = useGlobalSetAtom(SyncAPI.stateAtom)
    const [isPushing, setIsPushing] = useState(false)
    const [isPulling, setIsPulling] = useState(false)
    const { t } = useTranslation()
    const syncSetting = GlobalSetting.useSelectSettingAtom('sync')
    return (
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
          <Content className={'transparent-font'} flex gap={3} style={{ marginRight: -2 }}>
            {connection === 'syncing' && (
              <Icon
                tooltip={t('sync.Cancel all tasks')}
                name={'park-close'}
                style={{
                  color: Colors.Common.Red
                }}
                onClick={() => {
                  onClearInfo()
                  toast.success(t('sync.Tasks are canceled'))
                  SyncAPI.cloudClient()?.cancelAllTasks()
                  setTimeout(() => {
                    setSyncState(s => ({
                      ...s,
                      uploading: Object.fromEntries(Object.entries(s.uploading).filter(i => i[1].progress === 1)),
                      downloading: Object.fromEntries(Object.entries(s.downloading).filter(i => i[1].progress === 1))
                    }))
                  })
                }}
                className={ClassName.flatButton(4, '4px')}
              />
            )}
            {connection === 'connected' && (
              <>
                <Icon
                  onClick={() => {
                    onClearInfo()
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
                  tooltip={t('settings.Push local')}
                  name={isPushing ? 'park-loading-four' : 'park-arrow-up'}
                  className={ClassName.flatButton(4, '4px')}
                />
                <Icon
                  spin={isPulling}
                  name={isPulling ? 'park-loading-four' : 'park-arrow-down'}
                  onClick={() => {
                    setIsPulling(true)
                    onClearInfo()
                    SyncAPI.resolveConflict('pull')
                      .catch(() => {
                        toast.error('Failed to pull data!')
                      })
                      .finally(() => {
                        setIsPulling(false)
                      })
                  }}
                  tooltip={t('settings.Pull remote')}
                  className={ClassName.flatButton(4, '4px')}
                />
                <Icon
                  name={'park-file-conversion-one'}
                  tooltip={t('settings.Sync files')}
                  className={ClassName.flatButton(4, '4px')}
                  onClick={() => {
                    onClearInfo()
                    SyncAPI.file.syncLocalFiles()
                  }}
                />
              </>
            )}
          </Content>
        )}
      </Content>
    )
  },
  (prev, curr) => prev.connection === curr.connection && prev.bg === curr.bg
)

export default SyncTitlebar
