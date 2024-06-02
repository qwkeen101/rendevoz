import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatBytes } from '@/utils/fetchProcess'
import { Content } from '@/components'
import { GlobalSetting } from '@/core'
import checkSyncInfo from '@/api/sync/components/checkSyncInfo'
import { useLatest } from 'react-use'

export default () => {
  const { t } = useTranslation()
  const syncSetting = GlobalSetting.useSelectSettingAtom('sync')
  const [isCheckingSyncInfo, setIsCheckingInfo] = useState(false)
  const isCheckLatest = useLatest(isCheckingSyncInfo)
  const [syncInfo, setSyncInfo] = useState<{
    needDownload?: {
      size: number
      count: number
    }
    needUpload?: {
      size: number
      count: number
    }
    needSyncData?: boolean
  }>()
  const infoStr = useMemo(() => {
    const str: string[] = []
    if (syncInfo) {
      if (syncInfo.needSyncData) {
        str.push(t('sync.New data available'))
      }
      if (syncInfo.needDownload?.size) {
        str.push(`${t('sync.Files to download', { count: syncInfo.needDownload.count })} (${formatBytes(syncInfo.needDownload.size)})`)
      }
      if (syncInfo.needUpload?.size) {
        str.push(`${t('sync.Files to upload', { count: syncInfo.needUpload.count })} (${formatBytes(syncInfo.needUpload.size)})`)
      }
    }
    return str
  }, [syncInfo])

  const renderInfo = () => {
    const showInfo = !!(isCheckingSyncInfo || (syncSetting.enableAutoSync === false && syncSetting.conflictResolved && syncInfo))
    if (!showInfo) {
      return null
    }
    return (
      <Content className={'transparent-font font-size-12'} flex gap={6}>
        {isCheckingSyncInfo && <span>{t('sync.Checking sync status')}</span>}
        {infoStr.length ? <span>{infoStr.join(', ')}</span> : null}
        {syncInfo && !syncInfo?.needSyncData && !syncInfo?.needUpload?.size && !syncInfo?.needDownload?.size ? (
          <span>{t('sync.All data and files are up to date')}</span>
        ) : null}
      </Content>
    )
  }
  return {
    renderInfo,
    fetchInfo: () => {
      if (syncSetting.enableAutoSync === false && syncSetting.conflictResolved === true) {
        setIsCheckingInfo(true)
        checkSyncInfo()
          .then(res => {
            if (isCheckLatest.current) {
              setIsCheckingInfo(false)
              setSyncInfo(res)
            }
          })
          .catch(() => {
            setSyncInfo(undefined)
            setIsCheckingInfo(false)
          })
      }
    },
    clearInfo: () => {
      setIsCheckingInfo(false)
      setSyncInfo(undefined)
    }
  }
}
