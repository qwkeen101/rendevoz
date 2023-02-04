import { GraphScope } from '@/jotai/jotaiScope'
import { atom, useAtom } from 'jotai'


const tagsAtom = atom<string[]>([])

const useTags = () => useAtom(tagsAtom, GraphScope)

export default useTags
