import React, { memo, useState } from 'react'
import mindmapMedia from '@/core/components/media/components/AI/mindmapMedia'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import toast from 'react-hot-toast'
import AIMindmap from '@/core/components/ai/AIMindmap'
import useEditorState from '@/core/components/editor/hooks/useEditorState'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

export default memo(() => {
  const [state] = useEditorState()
  const v = state.aiSummary?.mindmap
  const instance = useEditorInstance()
  const [isLoading, setIsLoading] = useState(false)
  const loadMindmap = () => {
    setIsLoading(true)
    instance.aiOps?.mindmap().finally(() => {
      setIsLoading(false)
    })
  }
  return (
    <AIMindmap className={'h-full'} mindmapName={state.stringTitle} active={true} isLoading={isLoading} value={v} onLoad={loadMindmap} />
  )
})
