import { MetaStore, ObjectStore } from '@/api/stores'
import { useEffect, useState } from 'react'
import { Content } from '@/components'
import { useSetAtom } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'

export default ({ metaId }: { metaId: number }) => {
  const meta = MetaStore.useValue(metaId)
  const [labelCount, setLabelCount] = useState(0)
  const setGroupState = useSetAtom(GroupStateAtom)
  const targetObject = ObjectStore(meta?.type).useValue(meta?.objectId)
  useEffect(() => {
    if (targetObject && 'labels' in targetObject) {
      setLabelCount(targetObject.labels?.length || 0)
    }
  }, [targetObject])

  return (
    <Content
      fullWidth
      fullHeight
      onClick={event => {
        if (labelCount > 0 && meta) {
          setGroupState(s => ({
            ...s,
            sidebarVisible: true,
            sidebarState: {
              type: 'labels',
              objectType: meta.type!,
              objectId: meta.objectId!
            }
          }))
        }
      }}
    >
      {labelCount > 0 && <div style={{ fontWeight: 600 }}>{labelCount}</div>}
    </Content>
  )
}
