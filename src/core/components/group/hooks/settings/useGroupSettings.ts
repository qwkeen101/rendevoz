import { ObjectStore } from '@/api/stores'
import { getCurrentGroupVisibleProps } from '@/core/components/group/consts/currentVisibleProps'

const useGroupSettings = (groupId: number) => {
  const groupData = ObjectStore('group').useValue(groupId)
  const properties = groupData?.renderMode === 'table' ? groupData?.tableProperties : undefined
  const avaliableProps = getCurrentGroupVisibleProps()

}

export default useGroupSettings
