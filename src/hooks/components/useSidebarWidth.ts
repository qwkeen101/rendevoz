import { useGlobalAtom } from '@/jotai/jotaiScope'
import { atom } from 'jotai'

const sidebarWidthAtom = atom(240)

const useSidebarWidth = () => useGlobalAtom(sidebarWidthAtom)

export default useSidebarWidth
