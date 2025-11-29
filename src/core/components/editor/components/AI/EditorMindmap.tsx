import React, { memo, useState } from 'react'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import mindmapMedia from '@/core/components/media/components/AI/mindmapMedia'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import toast from 'react-hot-toast'
import AIMindmap from '@/core/components/ai/AIMindmap'

export default memo(({ active }: { active: boolean }) => {
  const [mediaState, setMediaState] = useMediaState()
  const v = mediaState.aiSummary?.mindmap
  const instance = useMediaInstance()
  const [isLoading, setIsLoading] = useState(false)
  const loadMindmap = () => {
    console.log(mediaState)
    instance
      .getSubtitle?.()
      .then(res => {
        if (!res.length) return
        setIsLoading(true)
        mindmapMedia(
          res.map(i => ({ text: i.text })),
          'Chinese'
        )
          .then(v => {
            setIsLoading(false)
            if (v) {
              instance.on?.({ type: 'aiSummarize', summary: { ...mediaState.aiSummary, mindmap: v } })
            }
          })
          .catch(res => {
            setIsLoading(false)
            toast.error('Failed to load mindmap!')
          })
      })
      .catch(() => {
        toast.error('No subtitle!')
      })
  }
  return <AIMindmap mindmapName={mediaState.name} active={active} isLoading={isLoading} value={v} onLoad={loadMindmap} />
})
