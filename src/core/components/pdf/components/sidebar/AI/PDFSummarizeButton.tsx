import { memo, useEffect, useState } from 'react'
import { Icon } from '@/components'
import { css } from '@emotion/css'
import classnames from 'classnames'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { useSelectAtomValue } from '@/hooks'
import { MediaStateAtom } from '@/core/components/media/hooks/useMediaState'
import { Icons } from '@/consts'
import useMediaSidebarState from '@/core/components/media/hooks/useMediaSidebarState'
import { isEqual } from 'lodash'
import { GlobalSetting } from '@/core'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
export default memo(() => {
  const [sidebarState, setSidebarState] = useMediaSidebarState()
  const instance = useMediaInstance()
  const { t } = useTranslation()
  const { subtitleList, summary, isSummarizing } = useSelectAtomValue(
    MediaStateAtom,
    s => ({
      subtitleList: s.subtitleList,
      summary: s.aiSummary,
      isSummarizing: s.isSummarizing
    }),
    { compare: isEqual }
  )
  const [hasSubtitle, setHasSubtitle] = useState(false)
  useEffect(() => {
    if (subtitleList?.length) {
      instance.getSubtitle?.().then(res => {
        if (res?.length) {
          setHasSubtitle(true)
        }
      })
    }
  }, [subtitleList])
  if (!hasSubtitle && !summary) {
    return null
  }
  return (
    <div
      onClick={() => {
        if (summary) {
          setSidebarState(s => ({ ...s, aiOpen: !s.aiOpen }))
          return
        }
        if (isSummarizing) {
          instance.aiOps?.cancelSummarize()
        } else {
          instance.aiOps?.summarize()
        }
      }}
      style={{
        padding: 1
      }}
      className={classnames(
        '!rounded-full shrink-0 w-9 @2xl:w-auto overflow-hidden items-center select-none cursor-pointer relative',
        css({
          '::before': {
            position: 'absolute',
            content: '""',
            left: '50%',
            top: '50%',
            zIndex: -1,
            width: '200px',
            height: '200px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(115.45% 162.76% at 19.33% 22.04%, #0a7bff 0%, #794aff 50%)'
          }
        })
      )}
    >
      <div
        className={classnames(
          'flex px-0 w-full h-full justify-center @2xl:!pl-3.5 @2xl:!pr-4 py-1 gap-2 hover:bg-opacity-90 dark:hover:bg-opacity-80 bg-black bg-global rounded-full',
          css({
            transition: 'background 0.02s ease'
          })
        )}
      >
        <Icon
          className={
            isSummarizing
              ? css({
                  path: {
                    stroke: 'url(#aigradient)'
                  }
                })
              : css({
                  svg: {
                    fill: 'url(#aigradient)'
                  }
                })
          }
          size={18}
          spin={isSummarizing}
          name={isSummarizing ? Icons.Loading : 'custom-stars'}
        />
        <div
          className={'hidden @2xl:block'}
          style={{
            backgroundImage: 'linear-gradient(270deg,#794aff,#0a7bff)',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          {summary ? t(trans.AI.Summary) : isSummarizing ? t(trans.AI.Summarizing) : t(trans.AI.Summarize)}
        </div>
      </div>
    </div>
  )
})
