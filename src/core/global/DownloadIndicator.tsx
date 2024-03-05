import { memo, useEffect, useState } from 'react'
import { ipcInstance } from '@/electron'
import { createPortal } from 'react-dom'
import { Content, WithBorder } from '@/components'
import { Line } from 'rc-progress'
import { Colors } from '@/consts'
import { formatBytes } from '@/utils/fetchProcess'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'

export type IDownloadProgress = {
  // bytes
  total: number
  // left bytes
  delta: number
  // tranferred bytes
  transferred: number
  // number: 50
  percent: number
  bytesPerSecond: number
}
// export const GlobalDownloadAtom = atom<>()
const GlobalDownloadIndicator = memo(() => {
  const [downloadProgress, setDownloadProgress] = useState<IDownloadProgress>()
  const [visible, setVisible] = useState(false)
  const [canRestart, setCanRestart] = useState(false)
  const { t } = useTranslation()
  useEffect(() => {
    if (downloadProgress?.percent && downloadProgress.percent >= 100) {
      setCanRestart(true)
      return
    }
    setCanRestart(false)
  }, [downloadProgress?.percent])
  useEffect(() => {
    const downloadListener = (e: IDownloadProgress) => {
      console.log(e)
      setDownloadProgress(e)
      setVisible(true)
    }
    const downloadedListener = () => {
      setCanRestart(true)
      setVisible(true)
    }
    ipcInstance.on('updateAvailable', () => {
      ipcInstance.send('downloadApp')
    })
    ipcInstance.on('download', downloadListener)
    ipcInstance.on('updateDownloaded', downloadedListener)
    return () => {
      ipcInstance.off('updateDownloaded')
      ipcInstance.off('download')
    }
  }, [])

  if (visible) {
    const renderProgress = () => {
      if (downloadProgress) {
        const { total, transferred, percent, bytesPerSecond, delta } = downloadProgress
        const totalNorm = formatBytes(total)
        const transferredNorm = formatBytes(transferred)
        const bytesPerSecondNorm = formatBytes(bytesPerSecond)
        return (
          <>
            <Content
              flex
              alignItems={'center'}
              style={{
                marginTop: 4
              }}
              gap={12}
              className={ClassName.description('13px')}
            >
              <div>
                {transferredNorm} / {totalNorm}
              </div>
              <div> {bytesPerSecondNorm}/s 🚀</div>
            </Content>
            <Line
              style={{
                width: '100%',
                height: 5,
                borderRadius: 99
              }}
              trailColor={'var(--border-background)'}
              strokeColor="var(--select-color)"
              percent={percent}
            />
          </>
        )
      }
    }

    return createPortal(
      <WithBorder
        padding={6}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          width: 300,
          zIndex: 99999,
          background: Colors.Background.Secondary
        }}
      >
        <Content flex alignItems={'center'} justifyContent={'space-between'} className={ClassName.title('15px')}>
          {canRestart ? `${t('general.Update downloaded')}!` : `${t('general.Downloading update')}...`}
          {canRestart && (
            <div
              onClick={() => {
                ipcInstance.send('installApp')
              }}
              style={{ fontSize: 13, padding: '1px 8px' }}
              className={ClassName.selectButton()}
            >
              {t('general.Install')}
            </div>
          )}
        </Content>
        {renderProgress()}
      </WithBorder>,
      document.body
    )
  }

  return null
})

export default GlobalDownloadIndicator
