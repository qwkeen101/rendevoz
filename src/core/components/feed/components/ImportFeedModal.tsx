import { memo, useRef, useState } from 'react'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { Icon, Modal } from '@/components'
import Parser from 'rss-parser'
import classnames from 'classnames'
import { isValidHttpUrl } from '@/core/components/webpage/utils'
import RSSIcon from '@/core/components/feed/components/RSSIcon'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
const parser = new Parser()

export default memo(() => {
  const [state, setState] = useState<{
    visible: boolean
    url?: string
    isLoading?: boolean
    failed?: boolean
    folderId?: number
    details?: {
      title: string
      thumbnail?: string
    }
  }>({ visible: false })
  const abort = useRef<AbortController>()
  const instance = useFeedInstance()
  const { t } = useTranslation()
  const getRssDetails = async () => {
    if (!state.url) return
    if (state.isLoading) return
    if (!isValidRSS) return
    try {
      const transformed = state.url
      if (transformed) {
        setState(s => ({ ...s, isLoading: true, details: undefined }))
        const controller = new AbortController()
        abort.current = controller
        const res = await fetch(transformed, {
          signal: controller.signal
        })
          .then(i => i.text())
          .then(i => parser.parseString(i))
        setTimeout(() => {
          setState(s => ({ ...s, isLoading: false, details: { title: res.title ?? 'Untitled', thumbnail: res.image?.url } }))
        }, 400)
        return
      }
    } catch (e) {
      setState(s => ({ ...s, failed: true, isLoading: false }))
    }
  }
  const importRSS = async () => {
    if (!state.details || !state.url) return
    try {
      await instance.feedOps?.importRssAsCollection(state.url, state.folderId)
      setState(s => ({ ...s, url: '', details: undefined, failed: false, isLoading: false }))
      toast.success('RSS imported successfully!')
    } catch (e) {
      toast.error('Failed to import RSS!')
    }
  }
  instance.importRSS = folderId => {
    setState(s => ({ ...s, folderId, visible: true, url: undefined, isLoading: false, failed: false, details: undefined }))
  }
  const isValidRSS = state.url && isValidHttpUrl(state.url)
  return (
    <Modal
      visible={state.visible}
      onClose={() => {
        setState(s => ({ ...s, visible: false }))
        abort.current?.abort()
        abort.current = undefined
      }}
    >
      <div className={'w-screen max-w-lg'}>
        <div className={'flex justify-between items-center px-3 gap-3 border-bottom'}>
          <Icon name={Icons.Search} className={'icon-18 transparent-font'} />
          <input
            autoFocus
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                if (state.details) {
                  importRSS()
                } else {
                  getRssDetails()
                }
              }
            }}
            className={'grow h-12 py-3'}
            placeholder={t('feed.Paste RSS url')}
            value={state.url}
            disabled={state.isLoading}
            onChange={e => setState(s => ({ ...s, url: e.target.value, details: undefined, failed: false }))}
          />
        </div>
        <div className={'w-full p-1.5'}>
          {state.details ? (
            <>
              <div onClick={() => importRSS()} className={classnames('button shrink-0 px-4 flex items-center gap-2')}>
                <div className={'flex items-center gap-2'}>
                  <div className={'flex items-center shrink-0 gap-2'}>
                    <RSSIcon className={'icon-18'} />
                    {t(trans.Feed.ImportRSS)}
                  </div>
                  <div className={'transparent-font break-all shrink font-size-12 bg-secondary line-clamp-1 py-0.5 px-2 rounded-full'}>
                    {state.details.title}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                onClick={() => getRssDetails()}
                className={classnames('button shrink-0 px-4 flex items-center gap-2', !isValidRSS && 'opacity-40 !cursor-not-allowed')}
              >
                <div className={'flex items-center gap-2 shrink-0'}>
                  <div className={'icon-18'}>{state.isLoading ? <Icon name={'park-loading-four'} spin /> : <RSSIcon />}</div>
                  {state.isLoading ? t('feed.Loading RSS') : t('feed.Find RSS')}
                </div>
                {state.failed ? (
                  <div
                    className={
                      'shrink font-size-12 text-red-400 !bg-red-600 !bg-opacity-15 bg-secondary line-clamp-1 py-0.5 px-2 rounded-full'
                    }
                  >
                    Not valid RSS
                  </div>
                ) : isValidRSS ? (
                  <div className={'transparent-font shrink font-size-12 bg-secondary line-clamp-1 py-0.5 px-2 rounded-full'}>
                    {state.url}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
})
