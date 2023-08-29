import { useSelectAtomValue } from 'rendevoz/types/hooks'
import { MetaStore, ObjectStore } from '@/stores'
import { MetaGroup } from '~/typings'
import { Button, Content } from '@/components'
import { ClassName } from 'rendevoz'
import BetterFilter from '@/core/database/filter/BetterFilter'
import { useEffect } from 'react'
import { transformFilterGroupToFilterArray } from '@/core/database/filter/useBetterFilter'

const InnerFilterer = ({ groupId }: { groupId: number }) => {
  const groupData = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  useEffect(() => {
    if (groupData?.rootFilterGroup) {
      const filterFunc = transformFilterGroupToFilterArray(groupData.rootFilterGroup)
      if (filterFunc !== undefined) {
        const allObjects = Array.from(MetaStore.getMetaObjectsMap().values())
        const leftObjects = allObjects.filter(filterFunc)
        const alreadyExistMetaIds = new Set([...groupData.childrenMetaIds])
        const leftObjectIds = new Set([...leftObjects.map(i => i.id)])

        const originMetas = groupData.childrenMetaIds || []
        const newMetas = [
          ...originMetas.filter(i => leftObjectIds.has(i)),
          ...leftObjects.filter(i => !alreadyExistMetaIds.has(i.id)).map(i => i.id)
        ]
        ObjectStore('group').updateOne({ id: groupId, childrenMetaIds: newMetas })
      }
    }
  }, [groupData?.rootFilterGroup])
  return (
    <Content flex column>
      {groupData?.rootFilterGroup && (
        <BetterFilter
          root={groupData.rootFilterGroup}
          onChange={r => ObjectStore('group').updateOne({ id: groupId, rootFilterGroup: r })}
        />
      )}
    </Content>
  )
}

export default InnerFilterer
