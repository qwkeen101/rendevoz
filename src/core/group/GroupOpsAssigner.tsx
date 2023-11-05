import { memo, RefObject } from 'react'
import useGroupHistory from '@/core/group/hooks/useGroupHistory'
import useBuildInGroupIndex from '@/core/group/hooks/ops/useBuildInGroupIndex'
import useAssignValueOps from '@/core/group/hooks/ops/useAssignValueOps'
import useAssignPathOps from '@/core/group/hooks/ops/useAssignPathOps'
import useAssignMetaOps from '@/core/group/hooks/ops/useAssignMetaOps'
import useAssignSelectOps from '@/core/group/hooks/ops/useAssignSelectOps'
import useGroupGlobalKey from '@/core/group/hooks/keyboard/useGroupGlobalKey'
import useAssignSidebarOps from '@/core/group/hooks/ops/useAssignSidebarOps'
import useSyncValueIndexAndValues from '@/core/group/hooks/useSyncValueIndexAndValues'
import useAssignCommonOps from '@/core/group/hooks/ops/useAssignCommonOps'
import useHideObjects from '@/core/group/hooks/useHideObjects'
import useGroupFilter from '@/core/group/hooks/useGroupFilter'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import useAssignBodyOps from '@/core/group/hooks/ops/useAssignBodyOps'

export default memo(({ groupId, bodyRef }: { bodyRef: RefObject<HTMLElement>; groupId: number }) => {
  const instance = useGroupInstance()
  useGroupHistory(groupId)
  useBuildInGroupIndex()
  useAssignValueOps(instance)
  useAssignPathOps(instance)
  useAssignMetaOps(instance)
  useAssignSelectOps(instance)
  useGroupGlobalKey()
  useAssignSidebarOps(instance)
  useSyncValueIndexAndValues()
  useAssignCommonOps(instance, groupId)
  useHideObjects()
  useGroupFilter(groupId)
  useAssignBodyOps(instance, bodyRef)
  return null
})
