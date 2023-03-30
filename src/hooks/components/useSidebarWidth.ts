import { useGlobalAtom } from '@/hooks/jotai'
import { atom } from 'jotai'

const sidebarWidthAtom = atom(240)

const useSidebarWidth = () => useGlobalAtom(sidebarWidthAtom)

export default useSidebarWidth
