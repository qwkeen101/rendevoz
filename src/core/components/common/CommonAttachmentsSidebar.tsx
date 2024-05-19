import useRenderSidebarAttachments from '@/core/object/renderer/useRenderSidebarAttachments'
import { Content } from '@/components'
import { memo } from 'react'

export default memo(({ metaId }: { metaId: number }) => {
  const { renderTitle, renderContainer } = useRenderSidebarAttachments(metaId)
  return (
    <Content flex column fullHeight fullWidth>
      {renderTitle()}
      {renderContainer()}
    </Content>
  )
})
