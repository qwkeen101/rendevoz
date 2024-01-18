import { atom, useAtomValue } from 'jotai'
import { IGroupInstance } from '~/typings'
import { IGroupState } from '@/core/components/group/hooks/useGroupState'
export type InnerGroupInstance = IGroupInstance &
  Partial<{
    getGroupState: () => IGroupState
  }>
export const GroupInstanceAtom = atom<InnerGroupInstance>({})

export const useGroupInstance = () => useAtomValue(GroupInstanceAtom)

export const useAssignGroupInstance = (instance: IGroupInstance) => {}
