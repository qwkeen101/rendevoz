import { GlobalScope } from '@/jotai/jotaiScope'
import { atom, useAtom } from 'jotai'

const currentCopyAtom = atom(null)

const useCurrentCopy = () => useAtom(currentCopyAtom, GlobalScope)

export default useCurrentCopy
