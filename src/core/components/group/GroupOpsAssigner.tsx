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
import assignViewOps from '@/core/components/group/hooks/ops/view/view'
import { MetaGroup } from '~/typings'
import trackMustProperties from '@/core/components/group/hooks/trackMustProperties'

export default memo(({ groupId, bodyRef, groupValue }: { bodyRef: RefObject<HTMLElement>; groupId?: number; groupValue?: MetaGroup }) => {
  const instance = useGroupInstance()
  // need group id to track data change
  useGroupHistory(groupId)
  useBuildInGroupIndex()
  useAssignValueOps(instance)
  useAssignPathOps(instance)
  useAssignMetaOps(instance)
  useAssignSelectOps(instance)
  useGroupGlobalKey()
  useAssignSidebarOps(instance)
  useSyncValueIndexAndValues()
  useAssignCommonOps(instance, groupValue)
  assignViewOps(instance)
  useHideObjects(groupId)
  useGroupFilter(groupValue)
  useAssignBodyOps(instance, bodyRef)
  trackMustProperties(groupValue)
  return null
})
