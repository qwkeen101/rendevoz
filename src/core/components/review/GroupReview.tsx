import { useGroupInstance, useGroupState } from '@/core/components/group/hooks'
import { memo, useLayoutEffect, useState } from 'react'
import Review from '@/core/components/review/index'
import { assignProperties } from '@/utils'

export default memo(({ groupId }: { groupId?: number }) => {
  const groupInstance = useGroupInstance()
  const [currentMetas, setCurrentMetas] = useState<number[]>([])
  const [visible, setVisible] = useState(false)
  useLayoutEffect(() => {
    if (visible) {
      const metas = groupInstance.valueOps?.getAllMetasInGroup()
      if (metas?.length) {
        setCurrentMetas(metas.map(i => i.id))
      }
    }
  }, [visible])
  assignProperties(groupInstance, {
    reviewOps: {
      open: () => setVisible(true)
    }
  })
  if (visible) {
    return (
      <div className={'absolute z-[10000] inset-0 w-full h-full bg-global'}>
        <Review groupId={groupId} currentMetas={currentMetas} onBackGroup={() => setVisible(false)} />
      </div>
    )
  }
  return null
})
