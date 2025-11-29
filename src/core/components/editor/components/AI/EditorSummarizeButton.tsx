import { memo, useEffect, useState } from 'react'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { useSelectAtomValue } from '@/hooks'
import { MediaStateAtom } from '@/core/components/media/hooks/useMediaState'
import useMediaSidebarState from '@/core/components/media/hooks/useMediaSidebarState'
import { isEqual } from 'lodash'
import SummarizeButton from '@/core/components/ai/SummarizeButton'

export default memo(() => {
  const [sidebarState, setSidebarState] = useMediaSidebarState()
  const instance = useMediaInstance()
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
    <SummarizeButton
      haveContent={!!summary}
      isOpen={sidebarState.aiOpen}
      isLoading={isSummarizing}
      onClick={() => {
        if (summary) {
          setSidebarState(s => ({ ...s, aiOpen: !s.aiOpen }))
          instance.on?.({
            type: 'externalStateChange',
            state: {
              defaultAiVisible: !sidebarState.aiOpen
            }
          })
          return
        }
        if (isSummarizing) {
          instance.aiOps?.cancelSummarize()
        } else {
          instance.aiOps?.summarize()
        }
      }}
    />
  )
})
