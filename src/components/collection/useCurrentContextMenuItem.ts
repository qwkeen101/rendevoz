import { GlobalScope } from '@/jotai/jotaiScope'
import { atom, useAtom } from 'jotai'

const currentCollectionContextMenuItemAtom = atom(null)

const useCurrentCollectionContextMenuItem = () => useAtom(currentCollectionContextMenuItemAtom, GlobalScope)

export default useCurrentCollectionContextMenuItem
