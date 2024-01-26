import { GlobalInstance, useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { Content } from '@/components'
import KanbanList from '@/core/components/group/components/kanban/KanbanList'
import GrouperHeader from '@/core/components/group/components/grouper/headers'
import { memo } from 'react'
import { MetaGroup } from '~/typings'

type View = MetaGroup['views'][0]
export default memo(() => {
  const currentViewGroups = useSelectAtomValue(GroupStateAtom, s => s.groups)
  const groupFieldType = useSelectAtomValue(GroupStateAtom, s => s.currentView?.group?.fieldType)
  const cardSize = useSelectAtomValue(GroupStateAtom, s => (s.currentView as undefined | (View & { type: 'gallery' }))?.options.cardSize)
  if (!currentViewGroups) return null
  let size = 280
  switch (cardSize) {
    case 'small': {
      size = 220
      break
    }
    case 'medium': {
      size = 280
      break
    }
    case 'large': {
      size = 360
      break
    }
  }
  return (
    <Content flex gap={2} style={{ padding: '0px 50px' }}>
      {currentViewGroups.map(i => {
        if (i.hidden) return null
        let showAddMore = true
        if (groupFieldType === 'metaType') {
          showAddMore = !!GlobalInstance.metaOps?.canCreateDirectly(i.name)
        }
        return (
          <Content key={i.id} style={{ flexShrink: 0, width: size }}>
            <GrouperHeader
              style={{
                padding: '8px 10px 8px'
              }}
              group={i}
              showToggle={false}
            />
            <KanbanList showAddMore={showAddMore} grouperId={i.id} key={i.id} values={i.values} />
          </Content>
        )
      })}
    </Content>
  )
})
