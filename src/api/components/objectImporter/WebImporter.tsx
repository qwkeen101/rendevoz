import { BetterInput, Icon, Tooltip } from '@/components'
import classnames from 'classnames'
import { memo, useEffect, useState } from 'react'
import produce from 'immer'
import FetchPregressBar from '@/core/components/common/FetchPregressBar'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { useAtom } from 'jotai'
import { ImportStateAtom } from '@/api/components/objectImporter/ObjectFileUploader'

export default memo(() => {
  const [url, setURL] = useState<string>()
  const [uploaded, setUploaded] = useAtom(ImportStateAtom)
  const { urls } = uploaded
  const { t } = useTranslation()
  const canUpload = url && !urls.some(i => i.url === url)
  const handleUpload = () => {
    if (canUpload) {
      setURL('')
      setUploaded(s => ({ ...s, urls: [{ uploaded: false, url, name: '' }, ...s.urls] }))
    }
  }
  return (
    <div className={'pt-6 w-full'}>
      <div className={'w-full px-6'}>
        <div className={'flex gap-2 bg-input font-size-13 focus-within-input pr-1.5 pl-3 py-1.5 w-full rounded-lg'}>
          <BetterInput
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                handleUpload()
              }
            }}
            value={url}
            autoFocus
            onChange={v => setURL(v.target.value)}
            placeholder={t('general.Type URL')}
            className={'flex-1'}
          />
          <div className={classnames(!canUpload && 'opacity-50', 'transition-opacity')}>
            <div onClick={handleUpload} className={classnames('button select-color-font', !canUpload && '!cursor-not-allowed')}>
              {t('general.Upload')}
            </div>
          </div>
        </div>
      </div>
      <div className={classnames('max-h-96 pb-6 px-6 overflow-y-auto', urls.length && 'mt-3')}>
        {urls.map((i, idx) => (
          <Item
            key={i.url}
            {...i}
            isLast={idx === urls.length - 1}
            onDelete={() => {
              setUploaded(s => ({ ...s, urls: s.urls.filter(o => o.url !== i.url) }))
            }}
            onUpload={n => {
              setUploaded(
                produce(uploaded, d => {
                  d.urls[idx].uploaded = true
                  d.urls[idx].name = n
                })
              )
            }}
          />
        ))}
      </div>
    </div>
  )
})

const Item = ({
  uploaded,
  name,
  url,
  onDelete,
  onUpload,
  isLast
}: {
  url: string
  name: string
  uploaded: boolean
  onDelete: VoidFunction
  onUpload: (name: string) => void
  isLast?: boolean
}) => {
  const { t } = useTranslation()
  useEffect(() => {
    if (!uploaded) {
      Global.utils
        .fetchDetails(url)
        .then(res => {
          onUpload(res.title)
          if (res.image || res.icon) {
            setIcon(res.image || res.icon)
          }
          if (res.appIcon) {
            setAppIcon(res.appIcon)
          }
        })
        .catch(() => {
          onDelete?.()
          toast.error(t(trans.Errors.NetworkError))
        })
    }
  }, [uploaded])
  const [appIcon, setAppIcon] = useState<string>()
  const [icon, setIcon] = useState<string>()
  const [progress, setProgress] = useState(0)
  return (
    <div className={classnames('flex flex-col gap-1', !isLast ? 'border-bottom py-3' : 'pt-3')}>
      <div className={'flex w-full items-center'}>
        {icon && <img src={icon} className={'size-10 object-cover rounded-md mr-3'} />}
        {!icon && appIcon && <Icon name={appIcon} size={16} className={'size-10 rounded-md border mr-3'} />}
        <div className={'flex-1'}>
          <div className={'font-size-12 break-all line-clamp-1'}>{name || 'Unknown website'}</div>
          <a target={'_blank'} href={url} className={'font-size-11 break-all line-clamp-1 hover:underline transparent-font'}>
            {url}
          </a>
        </div>
        <Icon
          style={{ transition: 'all 0.3s ease' }}
          strokeWidth={4}
          size={18}
          onClick={onDelete}
          name={'park-close-one'}
          className={'hover-active-button ml-3'}
        />
      </div>
      {!uploaded && (
        <div className={'flex items-center gap-3'}>
          <div
            style={{
              height: 6,
              borderRadius: 12
            }}
            className={classnames('w-full relative overflow-hidden', uploaded ? 'select-color-bg' : 'bg-third')}
          >
            <FetchPregressBar
              style={{
                height: 6,
                borderRadius: 12
              }}
              onProgress={p => setProgress(p)}
              isAnimating={!uploaded}
            />
          </div>
          <div className={'font-size-10 transparent-font'}>{`${(progress * 100).toFixed()}%`}</div>
        </div>
      )}
    </div>
  )
}
