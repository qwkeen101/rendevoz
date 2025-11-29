import React, { memo, useState } from 'react'
import AIMindmap from '@/core/components/ai/AIMindmap'
import usePDFState from '@/core/components/pdf/hooks/usePDFState'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { MetaStore } from '@/api/stores'

export default memo(() => {
  const [pdfState] = usePDFState()
  const v = pdfState.document?.aiSummary?.mindmap
  const instance = usePDFInstance()
  const [isLoading, setIsLoading] = useState(false)
  const pdfMeta = MetaStore.useObjectToMetaValue(pdfState.pdfId)
  const loadMindmap = () => {
    setIsLoading(true)
    instance.aiOps?.mindmap?.().finally(() => {
      setIsLoading(false)
    })
  }
  return <AIMindmap mindmapName={pdfMeta?.name ?? 'Unnamed PDF'} active={true} isLoading={isLoading} value={v} onLoad={loadMindmap} />
})
