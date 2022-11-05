import { GlobalScope } from '@/jotai/jotaiScope'
import { atom, useAtom } from 'jotai'

const currentCutAtom = atom(null)

const useCurrentCut = () => useAtom(currentCutAtom, GlobalScope)

export default useCurrentCut
