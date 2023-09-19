import { ObjectStore } from '@/stores'
import { getCurrentGroupVisibleProps } from '@/core/group/consts/currentVisibleProps'

const useGroupSettings = (groupId: number) => {
  const groupData = ObjectStore('group').useValue(groupId)
  const properties = groupData?.renderMode === 'table' ? groupData?.tableProperties : undefined
  const avaliableProps = getCurrentGroupVisibleProps()

}

export default useGroupSettings
