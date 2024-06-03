import { useTranslation } from 'react-i18next'
import { Content } from '@/components'
import { useSelectGlobalAtomValue } from '@/hooks'
import SyncAPI from '@/api/sync'
import { useEffect, useMemo, useState } from 'react'
import FileItem from '@/api/sync/components/FileItem'

const MAX_VISIBLE_LENGTH = 30
export default ({ onClear }: { onClear: VoidFunction }) => {
  const { t } = useTranslation()
  const downloading = useSelectGlobalAtomValue(SyncAPI.stateAtom, s => s.downloading)
  const [showMore, setShowMore] = useState(false)
  const grouped = useMemo(() => {
    if (Object.keys(downloading).length > 0) {
      const allItems = Object.values(downloading)
      const result: Record<'pending' | 'successful' | 'error' | 'waiting', typeof allItems> = {
        pending: [],
        successful: [],
        error: [],
        waiting: []
      }
      allItems.forEach(i => {
        if (i.progress === 0) {
          result.pending.push(i)
          return
        }
        if (i.error) {
          result.error.push(i)
          return
        }
        if (i.progress === 1) {
          result.successful.push(i)
          return
        }
        result.waiting.push(i)
      })
      return result
    }
  }, [downloading])
  const allFinished = grouped && !grouped.pending.length && !grouped.waiting.length && !grouped.error.length
  useEffect(() => {
    if (!allFinished) {
      setShowMore(false)
    }
  }, [allFinished])
  if (grouped) {
    let title = ''
    if (grouped.pending.length) {
      title += t('sync.Downloading files', { count: grouped.pending.length })
    }
    if (grouped.waiting.length || grouped.error.length) {
      const count = grouped.waiting.length + grouped.error.length
      if (title) {
        title += ` (${t('sync.Files in queue', { count })})`
      } else {
        title = t('sync.Download paused and files in queue', { count })
      }
    }
    if (allFinished) {
      title = t('sync.All files downloaded')
    }
    let visible: (typeof downloading)[0][] = []
    if (allFinished) {
      visible = grouped.successful.slice(0, MAX_VISIBLE_LENGTH)
    } else {
      if (grouped.pending.length) {
        visible = [...grouped.pending]
      } else {
        visible = [...grouped.error]
      }
    }

    return (
      <>
        <Content flex alignItems={'center'} justifyContent={'space-between'} style={{ marginTop: 4 }}>
          <div className={'transparent-font font-size-12'}>{title}</div>
          <div
            className={'normal-font select-color-font font-size-12 pointer'}
            onClick={() => {
              onClear()
              setShowMore(false)
            }}
          >
            {t('sync.Clear')}
          </div>
        </Content>
        <Content flex column gap={5}>
          {visible.map(i => (
            <FileItem item={i} key={i.name} type={'download'} />
          ))}
          {allFinished && grouped.successful.length > MAX_VISIBLE_LENGTH && !showMore ? (
            <div onClick={() => setShowMore(true)} className={'transparent-font font-size-12 link'}>
              {t('sync.More sync files', { count: grouped.successful.length - MAX_VISIBLE_LENGTH })}
            </div>
          ) : null}
        </Content>
      </>
    )
  }
  return null
}
