import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useMemo } from 'react'
import { MetaStore } from '@/api/stores'
import { Button, Content } from '@/components'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

export default function GroupGrouperMenu() {
  const instance = useGroupInstance()
  const visibleProperties = useSelectAtomValue(GroupStateAtom, s => s.visibleProperties)
  const currentGroupRule = useSelectAtomValue(GroupStateAtom, s => s.currentView?.group)
  const groupableProperties = useMemo(() => {
    const groupable = visibleProperties.filter(i => {
      if (i.type === 'basic') {
        switch (i.name) {
          case 'tags':
          case 'name':
            return true
        }
      }
      if (i.type === 'custom') {
        const prop = MetaStore.getPropDetails(i.id)
        switch (prop?.propType) {
          case 'singleSelect':
          case 'string':
          case 'number':
          case 'multiSelect':
            return true
        }
      }
      return false
    })
    return groupable.map(i => {
      if (i.type === 'basic') {
        return i
      }
      return { ...MetaStore.getPropDetails(i.id), type: 'custom' }
    })
  }, [visibleProperties])
  if (!currentGroupRule?.propertyId) {
    return (
      <Content>
        {groupableProperties.map(
          i =>
            i && (
              <div
                onClick={() => {
                  instance.updateCurrentView?.(w => ({
                    ...w,
                    group: {
                      propertyId: i.id,
                      propertyGroupType: i.type
                    }
                  }))
                }}
                key={i.id}
              >
                {i.name}
              </div>
            )
        )}
      </Content>
    )
  }
  return (
    <Content>
      <Button.IconButton text={'Group by'} suffixStr={'None'} suffixIcon={'park-right'} />
    </Content>
  )
}
