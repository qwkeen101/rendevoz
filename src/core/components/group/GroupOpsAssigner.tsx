import { memo, RefObject } from 'react'
import useGroupHistory from '@/core/components/group/hooks/useGroupHistory'
import useBuildInGroupIndex from '@/core/components/group/hooks/ops/useBuildInGroupIndex'
import useAssignValueOps from '@/core/components/group/hooks/ops/useAssignValueOps'
import useAssignPathOps from '@/core/components/group/hooks/ops/useAssignPathOps'
import useAssignMetaOps from '@/core/components/group/hooks/ops/useAssignMetaOps'
import useAssignSelectOps from '@/core/components/group/hooks/ops/useAssignSelectOps'
import useGroupGlobalKey from '@/core/components/group/hooks/keyboard/useGroupGlobalKey'
import useAssignSidebarOps from '@/core/components/group/hooks/ops/useAssignSidebarOps'
import useSyncValueIndexAndValues from '@/core/components/group/hooks/useSyncValueIndexAndValues'
import useAssignCommonOps from '@/core/components/group/hooks/ops/useAssignCommonOps'
import useHideObjects from '@/core/components/group/hooks/useHideObjects'
import useGroupFilter from '@/core/components/group/hooks/useGroupFilter'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import useAssignBodyOps from '@/core/components/group/hooks/ops/useAssignBodyOps'

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
