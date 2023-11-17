import { atom, useAtomValue } from 'jotai'
import { IGroupInstance } from '~/typings'

export const GroupInstanceAtom = atom<IGroupInstance>({})
export const useGroupInstance = () => useAtomValue(GroupInstanceAtom)

export const useAssignGroupInstance = () => {

}
