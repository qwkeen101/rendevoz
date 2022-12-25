import { EditorScope } from '@/jotai/jotaiScope'
import { atom, useAtom } from 'jotai'

const isDraggingAtom = atom(false)
const isDraggingDividerAtom = atom(false)
export const useIsDraggingDivider = () => useAtom(isDraggingDividerAtom, EditorScope)
const useIsDragging = () => useAtom(isDraggingAtom, EditorScope)

export default useIsDragging
