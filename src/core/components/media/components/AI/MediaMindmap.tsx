import React, { memo, useState } from 'react'
import { useSelectMediaState } from '@/core/components/media/hooks/useMediaState'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import AIMindmap from '@/core/components/ai/AIMindmap'
import { IMediaAiSummary } from '~/typings'

export default memo(({ mindmap }: { mindmap: IMediaAiSummary['mindmap'] }) => {
  const name = useSelectMediaState(s => s.name)
  const instance = useMediaInstance()
  const [isLoading, setIsLoading] = useState(false)
  const loadMindmap = () => {
    setIsLoading(true)
    instance.aiOps?.mindmap().finally(() => {
      setIsLoading(false)
    })
  }
  return <AIMindmap mindmapName={name} className={'h-full'} active={true} isLoading={isLoading} value={mindmap} onLoad={loadMindmap} />
})
