import { atom, useAtomValue } from 'jotai'
import { IMetaTableInstance } from '~/typings'

const TableInstanceAtom = atom<IMetaTableInstance>({})

export const useTableInstance = () => useAtomValue(TableInstanceAtom)
